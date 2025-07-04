## Telemetry(alpha)
在router中暴露/metrics端口，使用prometheus + grafana的方案作为telemetry，以实现可观测性
### install
通过bin安装prometheus与grafana
```bash
https://prometheus.io/docs/prometheus/latest/getting_started/
https://grafana.com/docs/grafana/latest/setup-grafana/start-restart-grafana/
```
### config
修改prometheus中的yml，从而更改拉取的时间间隔

```yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s 

scrape_configs:
  - job_name: "prometheus"

    static_configs:
      - targets: ["localhost:11236"]
        labels:
          app: "prometheus"

```

### run
```bash
./prometheus --config.file=prometheus.yml
```

```bash
./bin/grafana server
```
在grafana 3000端口grafana dashboard进行面板的修改、查看。后续附上重要metrics dashboard的yml配置