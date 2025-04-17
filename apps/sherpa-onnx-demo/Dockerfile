FROM ubuntu:22.04

RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
RUN apt-get update -y && apt-get install -y python3 python3-pip libasound2
RUN pip3 config set global.index-url https://mirrors.aliyun.com/pypi/web/simple
RUN pip3 install sherpa-onnx==1.10.27 -f https://k2-fsa.github.io/sherpa/onnx/cpu-cn.html

WORKDIR /app
ADD requirements.txt /app/
RUN pip3 install -r requirements.txt

# Create models directory
RUN mkdir -p /app/models

ADD . /app/
ENTRYPOINT ["python3", "app.py"]
