include .env

# Detect operating system
UNAME := $(shell uname)

build-extension:
ifeq ($(UNAME), Linux)
	@echo "Running command for Linux:"
	docker run --rm -it -u "$(id -u):$(id -g)" -v "${PWD}:/xk6" grafana/xk6 build v0.43.1 --with github.com/oleiade/xk6-kv --with github.com/grafana/xk6-dashboard@v0.7.3-alpha.1 --with github.com/Juandavi1/xk6-prompt@0.0.1 --with github.com/gpiechnik2/xk6-httpagg@v1.0.0 --with github.com/elastic/xk6-output-elasticsearch@v0.3.0
else ifeq ($(UNAME), Darwin)
	@echo "Running command for Mac:"
	docker run --rm -it -e GOOS=darwin -u "$(id -u):$(id -g)" -v "${PWD}:/xk6" grafana/xk6 build v0.43.1 --with github.com/oleiade/xk6-kv --with github.com/grafana/xk6-dashboard@v0.7.3-alpha.1 --with github.com/Juandavi1/xk6-prompt@0.0.1 --with github.com/gpiechnik2/xk6-httpagg@v1.0.0 --with github.com/elastic/xk6-output-elasticsearch@v0.3.0
else ifeq ($(UNAME), Windows)
	@echo "Running command for Windows:"
	docker run --rm -it -e GOOS=windows -u "$(id -u):$(id -g)" -v "${PWD}:/xk6" grafana/xk6 build v0.43.1 --output k6.exe --with github.com/oleiade/xk6-kv --with github.com/grafana/xk6-dashboard@v0.7.3-alpha.1 --with github.com/Juandavi1/xk6-prompt@0.0.1 --with github.com/gpiechnik2/xk6-httpagg@v1.0.0 --with github.com/elastic/xk6-output-elasticsearch@v0.3.0
else
	$(error Unsupported operating system: $(UNAME))
endif


# Default value for report file
report ?= dashboard/report.html

run:
	@if [ -z "$(extensions)" ]; then \
		echo "Please specify extensions using 'extensions' argument, e.g., make run extensions=\"dashboard\""; \
		exit 1; \
	fi
	@echo "=====> Running with extensions: $(extensions)"
	@if echo "$(extensions)" | grep -q "elasticsearch" && echo "$(extensions)" | grep -q "dashboard"; then \
		echo "=====> Running: yarn build"; \
		yarn build || { echo "Error: Failed to run yarn build"; exit 1; }; \
		echo "=====> Running: export K6_ELASTICSEARCH_URL=${K6_ELASTICSEARCH_URL}; export K6_ELASTICSEARCH_USER=${K6_ELASTICSEARCH_USER}; export K6_ELASTICSEARCH_PASSWORD=${K6_ELASTICSEARCH_PASSWORD}; ./k6 run --out dashboard=report=\"${report}\" --out output-elasticsearch dist/main.test.js"; \
		export K6_ELASTICSEARCH_URL=${K6_ELASTICSEARCH_URL}; \
		export K6_ELASTICSEARCH_USER=${K6_ELASTICSEARCH_USER}; \
		export K6_ELASTICSEARCH_PASSWORD=${K6_ELASTICSEARCH_PASSWORD}; \
		./k6 run --out dashboard=report="${report}" --out output-elasticsearch dist/main.test.js; \
	fi
	@if echo "$(extensions)" | grep -q "elasticsearch"; then \
		echo "=====> Running: yarn build"; \
		yarn build || { echo "Error: Failed to run yarn build"; exit 1; }; \
		echo "=====> Running: export K6_ELASTICSEARCH_URL=${K6_ELASTICSEARCH_URL}; export K6_ELASTICSEARCH_USER=${K6_ELASTICSEARCH_USER}; export K6_ELASTICSEARCH_PASSWORD=${K6_ELASTICSEARCH_PASSWORD}; ./k6 run --out output-elasticsearch dist/main.test.js"; \
		export K6_ELASTICSEARCH_URL=${K6_ELASTICSEARCH_URL}; \
		export K6_ELASTICSEARCH_USER=${K6_ELASTICSEARCH_USER}; \
		export K6_ELASTICSEARCH_PASSWORD=${K6_ELASTICSEARCH_PASSWORD}; \
		./k6 run --out output-elasticsearch dist/main.test.js; \
	elif echo "$(extensions)" | grep -q "dashboard"; then \
		echo "=====> Running: yarn build"; \
		yarn build || { echo "Error: Failed to run yarn build"; exit 1; }; \
		echo "=====> Running: ./k6 run --out dashboard=report=\"${report}\" dist/main.test.js"; \
		./k6 run --out dashboard=report="${report}" dist/main.test.js; \
	fi

