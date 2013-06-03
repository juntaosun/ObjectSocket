/// <reference path="./d/node/node.d.ts" />

import net = module("net");
import n = module("./ObjectSocket");

var objSocket: n.ObjectSocket;

var server: net.Server = net.createServer(function (socket: net.NodeSocket): void {

    console.log("connect");

    objSocket = new n.ObjectSocket(socket);

    objSocket.on("data", function (obj:any) { //�ͻ��˴�����Object
        console.log("receive object: ",obj.num, obj.name, obj.b , obj.arr);
    })

    objSocket.on("end", function () {
        console.log("on end")
    })

    //��ʼ��ÿ��5������ٶȷ����ͻ��˷���Object
   sendPackages(objSocket);



})



var sendnum:number = 0;
function sendPackages(socket:n.ObjectSocket): void
{
    setInterval(function () {
        var obj: any = {
            num: sendnum++,
            name: ("server" + Math.random().toString()),
            b: Math.random() > 0.5,
            arr: [<any> 1, 2, 3, "d", "e", "f"]
        }
        socket.sendObject(obj); //��ͻ��˷���obj
    }, 5);
}

server.listen(2345, "localhost");