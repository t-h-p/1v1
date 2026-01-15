import { type Component, createSignal} from "solid-js";
import { WebRTCConnector } from "./WebRTCConnector";

import { v4 as uuidv4 } from "uuid";

const App: Component = () => {
    const [randomUuid] = createSignal(uuidv4());
    const [randomTarget] = createSignal(uuidv4());
    return (
            <div>
                <WebRTCConnector myUuid={randomUuid()} />
            </div> 
    );
};

export default App;
