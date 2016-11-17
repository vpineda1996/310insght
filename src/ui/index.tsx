import * as React from "react";
import * as ReactDOM from "react-dom";

import { Hello } from "./components/Hello";

ReactDOM.render(
    (<div>
         <h1>LOL</h1>
         <h2>yeah you know</h2>
         <Hello compiler="TypeScript" framework="React" />
    </div>),
    document.getElementById("example")
);
