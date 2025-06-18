# Infer
infer类是进行推理和手动扩缩容的实现类
generate_stream接收流式推理请求，将请求压入Queue之后即退出，对请求的调度等实现在disaggregate中。由server中的处理函数对stream进行await和SSE推送响应，response的类型如下
1. PrefillDone
2. Prefill
3. Intermediate
4. End