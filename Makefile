.PHONY: help wasm wasm-clean

CRSLANG_REPO ?= https://github.com/coreruleset/crslang.git
CRSLANG_REF ?= main
CRSLANG_DIR ?= .cache/crslang
WASM_DIR := public/wasm

help:
	@echo "Targets:"
	@echo "  wasm       Build upstream crslang WASM and copy to $(WASM_DIR)/"
	@echo "  wasm-clean Remove cached upstream checkout ($(CRSLANG_DIR)/)"
	@echo ""
	@echo "Variables:"
	@echo "  CRSLANG_REPO  Upstream git URL (default: $(CRSLANG_REPO))"
	@echo "  CRSLANG_REF   Branch or tag to build (default: $(CRSLANG_REF))"

wasm:
	@command -v go >/dev/null 2>&1 || { echo "Error: go is required to build WASM"; exit 1; }
	@command -v git >/dev/null 2>&1 || { echo "Error: git is required"; exit 1; }
	@mkdir -p $(CRSLANG_DIR)
	@if [ ! -d $(CRSLANG_DIR)/.git ]; then \
		echo "Cloning $(CRSLANG_REPO) ($(CRSLANG_REF))..."; \
		git clone --depth 1 --branch $(CRSLANG_REF) $(CRSLANG_REPO) $(CRSLANG_DIR); \
	else \
		echo "Updating $(CRSLANG_DIR)..."; \
		git -C $(CRSLANG_DIR) fetch --depth 1 origin $(CRSLANG_REF); \
		git -C $(CRSLANG_DIR) checkout $(CRSLANG_REF); \
		git -C $(CRSLANG_DIR) reset --hard origin/$(CRSLANG_REF); \
	fi
	$(MAKE) -C $(CRSLANG_DIR) wasm
	@mkdir -p $(WASM_DIR)
	cp $(CRSLANG_DIR)/wasm/crslang.wasm $(CRSLANG_DIR)/wasm/wasm_exec.js $(WASM_DIR)/
	@echo "Installed: $(WASM_DIR)/crslang.wasm $(WASM_DIR)/wasm_exec.js"

wasm-clean:
	rm -rf $(CRSLANG_DIR)
