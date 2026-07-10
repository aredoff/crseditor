// Copyright 2026 CRSEditor contributors
// SPDX-License-Identifier: Apache-2.0

//go:build js && wasm
// +build js,wasm

package main

import (
	"strings"
	"syscall/js"
	"testing/fstest"
	"time"

	coreruleset "github.com/corazawaf/coraza-coreruleset/v4"
	"github.com/corazawaf/coraza/v3"
	"github.com/jcchavezs/mergefs"
	"github.com/aredoff/crseditor/wasm/coraza/internal"
)

func main() {
	js.Global().Set("corazaTest", js.FuncOf(runTest))
	select {}
}

func runTest(_ js.Value, args []js.Value) interface{} {
	if len(args) < 4 {
		return map[string]interface{}{
			"error": "expected at least 4 arguments: setupSecLang, userRules, request, response",
		}
	}

	setupSecLang := args[0].String()
	userRules := args[1].String()
	request := args[2].String()
	response := args[3].String()
	dataFilesJSON := ""
	if len(args) > 4 {
		dataFilesJSON = args[4].String()
	}

	dataFiles, err := internal.ParseDataFiles(dataFilesJSON)
	if err != nil {
		return map[string]interface{}{
			"error": "invalid data files payload: " + err.Error(),
		}
	}

	overlay := fstest.MapFS{}
	if userRules != "" {
		overlay["@owasp_crs/crseditor-user.conf"] = &fstest.MapFile{Data: []byte(userRules)}
	}
	for _, file := range dataFiles {
		name := internal.NormalizeDataFileName(file.Name)
		if name == "" {
			continue
		}
		overlay["@owasp_crs/"+name] = &fstest.MapFile{Data: []byte(file.Content)}
	}

	rootFS := coreruleset.FS
	if len(overlay) > 0 {
		rootFS = mergefs.Merge(coreruleset.FS, overlay)
	}

	cfg := coraza.NewWAFConfig().WithRootFS(rootFS)
	if setupSecLang != "" {
		cfg = cfg.WithDirectives(setupSecLang)
	}
	if userRules != "" {
		cfg = cfg.WithDirectives("Include @owasp_crs/crseditor-user.conf")
	}

	cfg = cfg.WithDirectives(`
SecAuditEngine RelevantOnly
SecAuditLogFormat JSON
SecAuditLogType Serial
`)

	waf, err := coraza.NewWAF(cfg)
	if err != nil {
		return map[string]interface{}{
			"error": err.Error(),
		}
	}

	tx := waf.NewTransaction()

	engineStatus := detectEngineStatus(setupSecLang, userRules)
	startTime := time.Now()

	if err := internal.RequestProcessor(tx, strings.NewReader(request)); err != nil {
		return map[string]interface{}{
			"error": "Error processing request: " + err.Error(),
		}
	}

	if err := internal.ResponseProcessor(tx, strings.NewReader(response)); err != nil {
		return map[string]interface{}{
			"error": "Error processing response: " + err.Error(),
		}
	}

	durationMicros := time.Since(startTime).Microseconds()
	return internal.BuildResults(tx, durationMicros, engineStatus)
}

func detectEngineStatus(setupSecLang, userRules string) string {
	combined := strings.ToLower(setupSecLang + "\n" + userRules)
	switch {
	case strings.Contains(combined, "secruleengine on"):
		return "On"
	case strings.Contains(combined, "secruleengine off"):
		return "Off"
	case strings.Contains(combined, "secruleengine detectiononly"):
		return "DetectionOnly"
	default:
		return "DetectionOnly"
	}
}
