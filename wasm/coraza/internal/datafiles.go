// Copyright 2026 CRSEditor contributors
// SPDX-License-Identifier: Apache-2.0

package internal

import (
	"encoding/json"
	"path"
	"strings"
)

type DataFilePayload struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

func NormalizeDataFileName(name string) string {
	trimmed := strings.TrimSpace(name)
	trimmed = strings.TrimPrefix(trimmed, "@owasp_crs/")
	if trimmed == "" {
		return ""
	}
	return path.Base(trimmed)
}

func ParseDataFiles(jsonPayload string) ([]DataFilePayload, error) {
	if strings.TrimSpace(jsonPayload) == "" {
		return nil, nil
	}
	var files []DataFilePayload
	if err := json.Unmarshal([]byte(jsonPayload), &files); err != nil {
		return nil, err
	}
	return files, nil
}
