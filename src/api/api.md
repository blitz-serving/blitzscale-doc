# API
## 1. 兼容推理接口（主入口）

### POST `/`
- **描述**：兼容 HuggingFace Text Generation Inference 的主推理接口。根据 `stream` 字段决定返回一次性结果还是流式结果。
- **请求体**：`CompatGenerateRequest`
- **响应体**：
  - `200 OK`：`GenerateResponse`（非流式）或 `StreamResponse`（流式，`text/event-stream`）
  - `424`/`429`/`422`/`500`：`ErrorResponse`
- **用法**：
  - `stream=false`：返回完整生成文本
  - `stream=true`：返回流式 token

---

## 2. 获取模型信息

### GET `/info`
- **描述**：获取当前服务的模型信息。
- **响应体**：`Info`
- **用法**：用于前端/监控查询模型元数据。

---

## 3. 健康检查

### GET `/health`
### GET `/`
### GET `/ping`
- **描述**：健康检查接口，返回服务是否可用。
- **响应体**：
  - `200 OK`：服务健康
  - `503`：`ErrorResponse`，服务不健康
- **用法**：用于负载均衡、监控等健康探测。

---

## 4. 标准推理接口

### POST `/generate`
- **描述**：标准推理接口，返回完整生成文本。
- **请求体**：`GenerateRequest`
- **响应体**：
  - `200 OK`：`GenerateResponse`
  - `424`/`429`/`422`/`500`：`ErrorResponse`
- **用法**：推荐用于新系统或直接对接 Blitz Scale。

---

## 5. 流式推理接口

### POST `/generate_stream`
- **描述**：流式推理接口，返回 token 流（SSE）。
- **请求体**：`GenerateRequest`
- **响应体**：
  - `200 OK`：`StreamResponse`（`text/event-stream`）
  - `424`/`429`/`422`/`500`：`ErrorResponse`（`text/event-stream`）
- **用法**：适合需要边生成边消费的场景。

---

## 6. AWS Sagemaker 兼容接口

### POST `/invocations`
- **描述**：兼容 Sagemaker 的推理接口，等价于 `/`。
- **请求体**：`CompatGenerateRequest`
- **响应体**：同 `/`

---

## 7. Prometheus 监控接口

### GET `/metrics`
- **描述**：Prometheus 监控采集接口。
- **响应体**：`String`（Prometheus 格式）
- **用法**：用于 Prometheus 采集服务指标。

---

## 8. 集群手动伸缩（可选，需编译特性）

### POST `/modify_cluster_state`
- **描述**：手动触发集群伸缩（仅在 `manually_scale` 特性开启时可用）。
- **请求体**：`ModifyClusterStateRequest`
- **响应体**：`200 OK` 或 `ErrorResponse`
- **用法**：开发/测试/调试集群弹性。

---

## 9. OpenAPI/Swagger 文档

### GET `/docs`
- **描述**：Swagger UI 文档页面。
- **用法**：可视化查看和调试所有 API。

### GET `/api-doc/openapi.json`
- **描述**：OpenAPI 规范文档（JSON）。
- **用法**：用于自动化工具/SDK生成。

---

# 端点汇总表

| 路径                    | 方法 | 请求体类型                | 响应体类型                      | 说明                                 |
| ----------------------- | ---- | ------------------------- | ------------------------------- | ------------------------------------ |
| `/`                     | POST | CompatGenerateRequest     | GenerateResponse/StreamResponse | 主推理接口（兼容/流式）              |
| `/info`                 | GET  | 无                        | Info                            | 获取模型信息                         |
| `/health`               | GET  | 无                        | 空/ ErrorResponse               | 健康检查                             |
| `/`                     | GET  | 无                        | 空/ ErrorResponse               | 健康检查（同上）                     |
| `/ping`                 | GET  | 无                        | 空/ ErrorResponse               | 健康检查（同上）                     |
| `/generate`             | POST | GenerateRequest           | GenerateResponse                | 标准推理接口                         |
| `/generate_stream`      | POST | GenerateRequest           | StreamResponse                  | 流式推理接口                         |
| `/invocations`          | POST | CompatGenerateRequest     | GenerateResponse/StreamResponse | Sagemaker 兼容接口                   |
| `/metrics`              | GET  | 无                        | String                          | 用于Prometheus 监控拉取metrics的端点 |
| `/modify_cluster_state` | POST | ModifyClusterStateRequest | 空/ErrorResponse                | 手动伸缩（可选）                     |
| `/docs`                 | GET  | 无                        | HTML                            | Swagger UI                           |
| `/api-doc/openapi.json` | GET  | 无                        | JSON                            | OpenAPI 规范                         |

---

# 典型请求/响应示例

## 1. `/generate` 请求示例

```json
POST /generate
Content-Type: application/json

{
  "inputs": "Hello, world!",
  "parameters": {
    "max_new_tokens": 20,
    "return_full_text": true
  }
}
```

**响应：**
```json
HTTP/1.1 200 OK
{
  "generated_text": "Hello, world! This is Blitz Scale...",
  "details": { ... }
}
```

---

## 2. `/generate_stream` SSE 响应片段

```
event: data
data: {"token": "Hello"}

event: data
data: {"token": ","}

event: data
data: {"token": " world"}

event: end
data: {"details": {...}}
```

---

## 3. `/info` 响应示例

```json
{
  "model_id": "bigscience/bloom",
  "model_sha": "...",
  "model_dtype": "float16",
  "model_device_type": "cuda",
  ...
}
```

---
