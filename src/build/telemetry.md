## Telemetry
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

```bash
./prometheus --config.file=prometheus.yml
```

```bash
./bin/grafana server
```
在grafana 3000端口grafana dashboard进行面板的修改、查看。后续附上重要metrics的dashboard