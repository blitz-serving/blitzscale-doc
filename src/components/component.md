# Components
组件可基本分为三个
1. router: rust实现，进行blitzscale核心zigzag、扩缩容的实现，接受client的推理请求，并将batch request发送给server进行推理。兼容openai接口
2. server: c++实现，负责拉取参数，进行算子执行
3. client: python实现的request-sim，用于测试时模拟客户请求