# Code Structure
- request-sim: 模拟client发送请求
- router_v2: Blitzscale主体部分，作为全局调度器、控制器，触发扩缩容，并通过调度逻辑将批处理请求发送到后端算子进行执行
  - - main: 主函数，解析传入参数并转换为Controller的参数
  - server: 注册HTTP请求端点并运行server进行监听
  - stub: 定义router向后端发送gRPC请求的方法
  - queue: 请求进入系统后append添加到这个队列中，next_batch每次从队列中取出下一个batch
  - lib: 定义使用到的各种结构体
  - infer: Infer类，控制向request发送流式响应，并相应创建disaggregation/colocation的controller
  - health/error: 使用到的健康/错误结构体
  - replica: 与调度/扩缩容相关的代码
    - disaggregation: PD分离下的控制类，进行调度、扩缩容
    - colocation: PDColocation下的控制类
    - metrics: 系统内负载的数据结构
    - relay_queue 实现zigzag prefill的队列，转移的batch在这里存放
    - mod: colocation相关的控制类
    - config: 配置类
    - cybernetics:
      - exec_blitz: blitz中进行扩容的策略(tanz,rdmabroadcast,rdma p2p,nvlbroadcast...)
      - exec_serverless:  serverless llm的扩容方式，从磁盘/内存中加载参数
      - mod: exec_blitz中执行参数发送的方法实现
      - planner: 循环监控系统状态，并生成扩缩容计划
    - steersman: 存储模型信息、replica与物理拓扑的映射等
- src: 算子执行后端，在这里发送CUDA kernel给GPU进行模型执行，并且通过GPU Direct RDMA进行模型参数传递
  - server: main函数所在的目录，初始化stub、service并启动grpc server
  - service: grpc service实现的位置，实现向外暴露的grpc端点服务
  - model: 抽象整个模型
  - layer: 抽象模型单个层
  - kernel: flashinfer相关算子，以及绑定算子实现的文件
  - blitz: 关于activation传递、kvcache传递、pd migration、参数广播、参数加载等blitzscale核心逻辑
  
- scripts: 运行整个系统测试的脚本
  - batchv2: 当前可用脚本
- config: 用于scripts测试的配置文件(toml)


Key implementations in each file are listed below...