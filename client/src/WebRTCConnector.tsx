import { createSignal, onMount, onCleanup } from "solid-js";
import { io, Socket } from "socket.io-client";
import { stringify } from "uuid";

const RTC_CONFIG = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const WebRTCConnector = (props: {
    myUuid: string;
}) => {
    let socket: Socket;
    let pc: RTCPeerConnection;
    const [connectionStatus, setConnectionStatus] =
        createSignal("Disconnected");
    const [remoteStream, setRemoteStream] = createSignal<MediaStream | null>(
        null
    );
    const [targetUuid, setTargetUuid] = createSignal("");
    const [incomingCall, setIncomingCall] = createSignal(false);

    onMount(() => {
        socket = io("http://localhost:8080");
        
        socket.on("connect", () => setConnectionStatus("Signaling Connected"));

        socket.on("webrtc-offer", async ({ sdp, fromUuid }) => {
            setIncomingCall(true);
            setTargetUuid(fromUuid);
            await handleOffer(sdp, fromUuid);
        });

        socket.on("webrtc-answer", async ({ sdp }) => {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        socket.on("webrtc-ice-candidate", async ({ candidate }) => {
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
    });

    const setupPeerConnection = (target: string) => {
        pc = new RTCPeerConnection(RTC_CONFIG);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("webrtc-ice-candidate", {
                    candidate: event.candidate,
                    toUuid: target,
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        pc.onconnectionstatechange = () => {
            setConnectionStatus(pc.connectionState);
        };
    };

    const login = async () => {
        const name = `Test-${props.myUuid}`
        const password = String(Math.random());
        socket.emit("login-request", {name: name, password: password});
    }

    const initiateCall = async () => {
        const target = targetUuid().trim();
        if (!target) return;

        setupPeerConnection(target);

        // Add local tracks here if needed (e.g., webcam)
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc-offer", {
            sdp: offer,
            toUuid: target,
            fromUuid: props.myUuid,
        });
    };

    const handleOffer = async (
        sdp: RTCSessionDescriptionInit,
        fromUuid: string
    ) => {
        setupPeerConnection(fromUuid);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
            sdp: answer,
            toUuid: fromUuid,
        });
    };

    onCleanup(() => {
        pc?.close();
        socket?.disconnect();
    });

    return (
        <div class="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
            <div class="text-xl font-medium text-black">
                WebRTC Status: {connectionStatus()}
            </div>

            {incomingCall() && (
                <div class="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p class="text-green-800 text-sm font-medium">
                        Incoming call auto-accepted from: {targetUuid()}
                    </p>
                </div>
            )}
            
            <p class="text-slate-500 text-sm">
                Your UUID: {props.myUuid}
            </p>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700">
                    Target UUID
                </label>
                <input
                    type="text"
                    value={targetUuid()}
                    onInput={(e) => setTargetUuid(e.currentTarget.value)}
                    placeholder="Enter target UUID to connect"
                    class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            
            <button
                onClick={login}
                class="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed" 
            >
                Login
            </button>

            <button
                onClick={initiateCall}
                disabled={!targetUuid().trim()}
                class="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Start Connection
            </button>

            {remoteStream() && (
                <video
                    ref={(el) => (el.srcObject = remoteStream())}
                    autoplay
                    playsinline
                    class="w-full rounded-lg bg-black aspect-video"
                />
            )}
        </div>
    );
};