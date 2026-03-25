import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initializeStorage } from "./utils/storage";
import "./index.css";
import App from "./App";

initializeStorage();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
