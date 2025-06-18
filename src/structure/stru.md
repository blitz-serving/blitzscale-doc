# Code Structure
- request-sim: 模拟client发送请求
- router_v2: Blitzscale主体部分，作为全局调度器、控制器，触发扩缩容，并通过调度逻辑将批处理请求发送到后端算子进行执行
- src: 算子执行后端，在这里发送CUDA kernel给GPU进行模型执行，并且通过GPU Direct RDMA进行模型参数传递
  - main: 主函数，解析传入参数并转换为Controller的参数
  - server: 注册HTTP请求端点并运行server进行监听
  - stub: 定义router向后端发送gRPC请求的方法
  - queue: 请求进入系统后append添加到这个队列中，next_batch每次从队列中取出下一个batch
  - lib: 定义使用到的各种结构体
  - infer: Infer类
  - health/error: 使用到的健康/错误结构体
  - replica: 与调度/扩缩容相关的代码
    - disaggregation: PD分离下的控制类，进行调度、扩缩容
    - colocation: PDColocation下的控制类
    - metrics: 系统内负载的数据结构
    - relay_queue:
    - mod: 
    - config: 配置类
    - cybernetics:
      - exec_blitz: blitz中进行参数传递的方法实现
      - exec_serverless: 
      - mod: 
      - planner: 
    - steersman: 
- scripts: 运行整个系统测试的脚本
  - batchv2: 当前可用脚本
- config: 用于scripts测试的配置文件(toml)


Key implementations in each file are listed below...