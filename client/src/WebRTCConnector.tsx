import { createSignal, onMount, onCleanup, createEffect } from "solid-js";
import { io, Socket } from "socket.io-client";

const RTC_CONFIG = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const WebRTCConnector = (props: {
    myUuid: string;
    targetUuid?: string;
    
}) => {
    let socket: Socket;
    let pc: RTCPeerConnection;

    const [connectionStatus, setConnectionStatus] =
        createSignal("Disconnected");
    const [remoteStream, setRemoteStream] = createSignal<MediaStream | null>(
        null
    );

    onMount(() => {
        socket = io("http://localhost:3000", {
            query: { uuid: props.myUuid },
        });

        socket.on("connect", () => setConnectionStatus("Signaling Connected"));

        socket.on("webrtc-offer", async ({ sdp, fromUuid }) => {
            await handleOffer(sdp, fromUuid);
        });

        socket.on("webrtc-answer", async ({ sdp }) => {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        socket.on("webrtc-ice-candidate", async ({ candidate }) => {
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
    });

    const setupPeerConnection = (targetUuid: string) => {
        pc = new RTCPeerConnection(RTC_CONFIG);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("webrtc-ice-candidate", {
                    candidate: event.candidate,
                    toUuid: targetUuid,
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

    const initiateCall = async () => {
        if (!props.targetUuid) return;
        setupPeerConnection(props.targetUuid);

        // Add local tracks here if needed (e.g., webcam)
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc-offer", {
            sdp: offer,
            toUuid: props.targetUuid,
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
            <p class="text-slate-500 text-sm">
                Self: {props.myUuid}
            </p>
            <p class="text-slate-500 text-sm">
                Target: {props.targetUuid || "None"}
            </p>

            <button
                onClick={initiateCall}
                disabled={!props.targetUuid}
                class="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
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
