# Usage

如果希望batchv2脚本修改client发送请求的逻辑，例如从dataset的replay切换到mock随机生成数据模式，需要修改runner.py里_dump_client_bash_script和launch_client中启动client的脚本命令，注释掉`--replay-mode`项，并将`--dataset-type`项修改为`mock`，以使用mock模式的client发送请求，无需提前准备数据集

运行脚本前需要使用python安装所需依赖。启动server、client、router的命令会在`log_home`目录下