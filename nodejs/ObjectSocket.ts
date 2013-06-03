/// <reference path="./d/node/node.d.ts" />
import net = module("net");
import event = module("events");

export class ObjectSocket extends event.EventEmitter{
    
    private _socket: net.NodeSocket;
    private _bufferEnd: number = 0;
    private _bufferOffset: number = 0;
    private _lastLen: number = 0;
    private _buffer: NodeBuffer = new Buffer(1024);//1k; 

    private _open: bool = false;

    constructor(socket: net.NodeSocket)
    {
        
        super();
        this._socket = socket;
       
        var This: ObjectSocket = this;
        this._socket.on("connect", function () {
            This._open = true;
        })
        this._socket.on("data", function (data: NodeBuffer) {
            This.readBuffer(data);
            This.decodeBuffer();
        })
        this._socket.on("end", function (data: NodeBuffer) {
            This.emit("end");
        })
        this._socket.on("close", function () {
            This._open = false;
        })
    }

    /**
    * ����Object
    */
    public sendObject(obj: Object): void
    {
        if (!this._open)
            return;
        var str: string = JSON.stringify(obj);
        var len: number = Buffer.byteLength(str, "utf8");
        var b: NodeBuffer = new Buffer(4 + len);
        b.writeInt32BE(len, 0);
        b.write(str, 4);
        this._socket.write(b);
    }

    /**
    *  ��ÿ��socket���������ݶ���_bufferβ���ȴ�����
    */
    private readBuffer(data: NodeBuffer): void
    {
        //-------------------------------------------------------------
        // ��ͬ��flash�ˣ�����_buffer�ǹ̳��ģ�����Ҫ��������

        var needLength: number = data.length + this._bufferEnd;
        if (needLength > this._buffer.length) {
            //bufferװ���������������ˣ��������µ���ԭ����2����
            var newLength: number = this._buffer.length;
            while (needLength > newLength) {
                newLength *= 2;
            }
            if (newLength >= (8 * 1024)) {
                throw new Error("buffer must less than 8k");
            } else {
                var tmpbuffer: NodeBuffer = new Buffer(newLength);
                this._buffer.copy(tmpbuffer, 0, this._bufferOffset, this._bufferEnd);
                this._buffer = tmpbuffer;
                this._bufferEnd = this._bufferEnd - this._bufferOffset;
                this._bufferOffset = 0;
                console.log("new buffer", this._buffer.length, this._bufferOffset, this._bufferEnd);
            }
        }
        //-------------------------------------------------------------------------
        data.copy(this._buffer, this._bufferEnd);
        this._bufferEnd += data.length;
    }

   
    /**
    * ����_buffer
    */
    private decodeBuffer(): void
    {
        // decode buffer
        var tryAgain: bool = false;
        do {
            if (this._lastLen == 0) //û��ȡ������
            {
                if ((this._bufferEnd - this._bufferOffset) >= 4) // �а�ͷ
                {
                    var len: number = this._buffer.readUInt32BE(this._bufferOffset);
                    if (len <= 0)
                        throw new Error("package length error");
                    this._bufferOffset += 4;
                    if ((this._bufferEnd - this._bufferOffset) >= len)//��������
                    {
                        var packageData: NodeBuffer = new Buffer(len);//����������
                        this._buffer.copy(packageData, 0, this._bufferOffset, this._bufferEnd);                  
                        this.getPackage(packageData);
                        this._lastLen = 0;
                        this._bufferOffset += len;
                        tryAgain = true; //���ܻ��а�
                    } else { //ֻ�г��ȣ�����ȫ�����´�
                        this._lastLen = len;
                        tryAgain = false;
                    }

                } else {
                    if ((this._bufferEnd - this._bufferOffset) == 0) {
                        // clear()
                        this._buffer = new Buffer(1024);//1k
                        this._bufferOffset = this._bufferEnd = 0;
                        tryAgain = false;

                    } else if ((this._bufferEnd - this._bufferOffset) < 0) {
                        throw new Error("not possible");
                    }
                }

            } else {
                if (this._bufferEnd - this._bufferOffset >= this._lastLen) {
                    //����������
                    var packageData: NodeBuffer = new Buffer(this._lastLen);//����������
                    this._buffer.copy(packageData, 0, this._bufferOffset, this._bufferEnd);
                    this.getPackage(packageData);
                    this._bufferOffset += this._lastLen;
                    tryAgain = true;//�п��ܻ��а�
                } else {
                    tryAgain = false;
                }
            }

        } while (tryAgain)
    }


    private getPackage(data: NodeBuffer): void
    {
        this.emit("data", JSON.parse(data.toString()));
    }



}

