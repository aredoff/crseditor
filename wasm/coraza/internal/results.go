// Copyright 2023 The OWASP Coraza contributors
// SPDX-License-Identifier: Apache-2.0

package internal

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/corazawaf/coraza/v3/collection"
	"github.com/corazawaf/coraza/v3/experimental/plugins/plugintypes"
	"github.com/corazawaf/coraza/v3/types"
	"github.com/corazawaf/coraza/v3/types/variables"
)

func BuildResults(tx types.Transaction, durationMicros int64, engineStatus string) map[string]interface{} {
	txState := tx.(plugintypes.TransactionState)
	collections := make([][]string, 0)

	txState.Variables().All(func(_ variables.RuleVariable, v collection.Collection) bool {
		for index, md := range v.FindAll() {
			collections = append(collections, []string{
				v.Name(),
				md.Key(),
				strconv.Itoa(index),
				md.Value(),
			})
		}
		return true
	})

	if err := tx.Close(); err != nil {
		fmt.Printf("Error closing transaction: %s\n", err.Error())
	}

	jsdata, err := json.Marshal(collections)
	if err != nil {
		fmt.Printf("Error marshaling collections: %s\n", err)
	}

	md := [][]string{}
	for _, m := range tx.MatchedRules() {
		msg := m.Message()
		if msg == "" {
			msg = "Rule matched (no message specified)"
		}
		md = append(md, []string{strconv.Itoa(m.Rule().ID()), msg})
	}
	matchedData, err := json.Marshal(md)
	if err != nil {
		fmt.Printf("Error marshaling matched data: %s\n", err)
	}

	auditData := map[string]interface{}{
		"transaction": map[string]interface{}{
			"id":            tx.ID(),
			"timestamp":     fmt.Sprintf("%d", durationMicros),
			"client_ip":     "playground",
			"server_id":     "crseditor",
			"engine_status": engineStatus,
		},
		"request": map[string]interface{}{
			"method":  "",
			"uri":     "",
			"headers": []map[string]string{},
			"body":    "",
		},
		"response": map[string]interface{}{
			"status":  200,
			"headers": []map[string]string{},
			"body":    "",
		},
		"rules": map[string]interface{}{
			"matched_count": len(tx.MatchedRules()),
			"matched_rules": []map[string]interface{}{},
		},
		"messages": []map[string]interface{}{},
	}

	for _, matchedRule := range tx.MatchedRules() {
		rule := matchedRule.Rule()
		ruleData := map[string]interface{}{
			"id":      rule.ID(),
			"phase":   rule.Phase(),
			"message": matchedRule.Message(),
			"data":    matchedRule.Data(),
			"tags":    rule.Tags(),
		}

		if rule.SecMark() != "" {
			ruleData["secmark"] = rule.SecMark()
		}

		auditData["rules"].(map[string]interface{})["matched_rules"] = append(
			auditData["rules"].(map[string]interface{})["matched_rules"].([]map[string]interface{}),
			ruleData,
		)

		messageData := map[string]interface{}{
			"rule_id":  rule.ID(),
			"message":  matchedRule.Message(),
			"data":     matchedRule.Data(),
			"severity": "NOTICE",
		}
		auditData["messages"] = append(auditData["messages"].([]map[string]interface{}), messageData)
	}

	txState.Variables().All(func(_ variables.RuleVariable, v collection.Collection) bool {
		switch v.Name() {
		case "REQUEST_METHOD":
			if entries := v.FindAll(); len(entries) > 0 {
				auditData["request"].(map[string]interface{})["method"] = entries[0].Value()
			}
		case "REQUEST_URI":
			if entries := v.FindAll(); len(entries) > 0 {
				auditData["request"].(map[string]interface{})["uri"] = entries[0].Value()
			}
		}
		return true
	})

	auditJSON, err := json.Marshal(auditData)
	var auditLogString string
	if err != nil {
		fmt.Printf("Error marshaling audit log: %s\n", err)
		auditLogString = `{"error": "Failed to generate audit log"}`
	} else {
		auditLogString = string(auditJSON)
	}

	disruptiveAction := "none"
	disruptiveRule := "-"
	disruptiveStatus := 0

	if it := tx.Interruption(); it != nil {
		disruptiveAction = it.Action
		disruptiveRule = strconv.Itoa(it.RuleID)
		disruptiveStatus = it.Status

		auditData["interruption"] = map[string]interface{}{
			"action":  it.Action,
			"rule_id": it.RuleID,
			"status":  it.Status,
		}

		if updatedAuditJSON, marshalErr := json.Marshal(auditData); marshalErr == nil {
			auditLogString = string(updatedAuditJSON)
		}
	}

	return map[string]interface{}{
		"transaction_id":    tx.ID(),
		"collections":       string(jsdata),
		"matched_data":      string(matchedData),
		"rules_matched_total": strconv.Itoa(len(tx.MatchedRules())),
		"audit_log":         auditLogString,
		"disruptive_action": disruptiveAction,
		"disruptive_rule":   disruptiveRule,
		"disruptive_status": disruptiveStatus,
		"duration":          durationMicros,
		"engine_status":     engineStatus,
	}
}
