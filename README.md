<div align="center">
  
  ![banner](https://www.beincom.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo_beincom_icon_and_text_only_post_alpha.539e3bfb.webp&w=640&q=75)

# Test with K6

</div>

BIC E2E and Performance test.

## Installation

1. Install dependencies

```bash
yarn
```

2. Set environment variables

```bash
$ cp .example.env .env

# open .env and modify the environment variables (if needed)
```

## Running the Test using Makefile

1. Build k6 with extensions

```bash
make build-extension
```

2. Run test with parameters

```bash
make run extensions="dashboard,elasticsearch" report="dashboard/report.html"
```

Recognized parameters:

- `extensions`: K6 extensions for output (separate by `,`, options: `dashboard`, `elasticsearch`).
- `report`: File name for exporting the report (used if dashboard extension is included).

If using `elasticsearch` metrics are stored in the index `k6-metrics`, which is automatically created by the [xk6-output-elasticsearch](https://github.com/elastic/xk6-output-elasticsearch) extension.

## Running the Test manual

1. Build script test

```bash
yarn build
```

2. Build k6 with extensions

### For Linux
```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "${PWD}:/xk6" grafana/xk6 build v0.43.1 --with github.com/oleiade/xk6-kv --with github.com/grafana/xk6-dashboard@v0.7.3-alpha.1 --with github.com/Juandavi1/xk6-prompt@0.0.2 --with github.com/gpiechnik2/xk6-httpagg@v1.0.0 --with github.com/elastic/xk6-output-elasticsearch@v0.3.0
```

### For MacOS
```bash
docker run --rm -it -e GOOS=darwin -u "$(id -u):$(id -g)" -v "${PWD}:/xk6" grafana/xk6 build v0.43.1 --with github.com/oleiade/xk6-kv --with github.com/grafana/xk6-dashboard@v0.7.3-alpha.1 --with github.com/Juandavi1/xk6-prompt@0.0.2 --with github.com/gpiechnik2/xk6-httpagg@v1.0.0 --with github.com/elastic/xk6-output-elasticsearch@v0.3.0
```

### For Windows
```bash
docker run --rm -it -e GOOS=windows -u "$(id -u):$(id -g)" -v "${PWD}:/xk6" grafana/xk6 build v0.43.1 --output k6.exe --with github.com/oleiade/xk6-kv --with github.com/grafana/xk6-dashboard@v0.7.3-alpha.1 --with github.com/Juandavi1/xk6-prompt@0.0.2 --with github.com/gpiechnik2/xk6-httpagg@v1.0.0 --with github.com/elastic/xk6-output-elasticsearch@v0.3.0
```

3. Run the test

```bash
./k6 run --out dashboard=report=dashboard/report.html dist/main.test.js
```

Run with output elasticsearch. The metrics are stored in the index `k6-metrics` which will be automatically created by extension [xk6-output-elasticsearch](https://github.com/elastic/xk6-output-elasticsearch)
```bash
export K6_ELASTICSEARCH_URL=xxx
export K6_ELASTICSEARCH_USER=xxx
export K6_ELASTICSEARCH_PASSWORD=xxx

./k6 run --out dashboard=report=dashboard/report.html --out output-elasticsearch dist/main.test.js
```

## Output Results

### [HTTP Aggregation (httpagg)](https://github.com/gpiechnik2/xk6-httpagg)

- By default, the httpagg report is exported to `dashboard/httpagg-report.html`.

### [Dashboard](https://github.com/grafana/xk6-dashboard)

- By default, the dashboard report is exported to `dashboard/report.html`.

- If the report parameter is provided when running the test, the report is exported to the specified path.

### [Elasticsearch](https://github.com/elastic/xk6-output-elasticsearch)

- Metrics are stored in the index `k6-metrics`, automatically created by the xk6-output-elasticsearch extension.

## Writing own tests

House rules for writing tests:

- The test code is located in `src` folder
- The entry points for the tests need to have "_test_" word in the name to distinguish them from auxiliary files. You can change the entry [here](./webpack.config.js#L8).
- If static files are required then add them to `./assets` folder. Its content gets copied to the destination folder (`dist`) along with compiled scripts.

## Steps to run the seed data

1. Change config

- Update config in `config.ts` if you need.
- Update `communityIndex` in `scripts/main.script.ts` to change the community for create contents.

2. Run the seed

```bash
yarn create-data
```

### Transpiling and Bundling

By default, k6 can only run ES5.1 JavaScript code. To use TypeScript, we have to set up a bundler that converts TypeScript to JavaScript code.

This project uses `Babel` and `Webpack` to bundle the different files - using the configuration of the [`webpack.config.js`](./webpack.config.js) file.

If you want to learn more, check out [Bundling node modules in k6](https://k6.io/docs/using-k6/modules#bundling-node-modules).
