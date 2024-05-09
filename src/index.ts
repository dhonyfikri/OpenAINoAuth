import express, { Request, Response, NextFunction } from "express";
import axios, { AxiosInstance } from "axios";
import https from "https";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";

type Session = {
    deviceId: string;
    persona: string;
    arkose: {
        required: boolean;
        dx: any;
    };
    turnstile: {
        required: boolean;
    };
    proofofwork: {
        required: boolean;
        seed: string;
        difficulty: string;
    };
    token: string;
};

function getAxiosInstance(deviceId: String): AxiosInstance {
    const instance = axios.create({
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        proxy: false,
        headers: {
            accept: "*/*",
            "accept-encoding": "gzip, deflate, br",
            "content-length": "0",
            "cache-control": "no-cache",
            connection: "keep-alive",
            "user-agent": "PostmanRuntime/7.37.3",
            "oai-device-id": `${deviceId}`,
            cookie: "__cf_bm=AfNL5PJ.DvT2YIqzUFbtETELuxnuPrFsY5Fl.GsOUKk-1715158489-1.0.1.1-4_X9SdY1VG1SqUj6dDf2RMKMiPoNJujoqTahNmRpObDigW5UeML3fSaFsVX9PiAhjdy0WFUR77a2SDKcfc2LRg; __cflb=0H28vVfF4aAyg2hkHFTZ1MVfKmWgNcKF1mn4HA1wRzu; _cfuvid=RgTz3zI5dHn3fW7IxpOwywZtY0ik0oKbJ752pM6OyHg-1715158489111-0.0.1.1-604800000",
        },
    });
    return instance;
}

function enableCORS(req: Request, res: Response, next: NextFunction) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function handleNewSession(req: Request, res: Response) {
    try {
        const newDeviceId = uuidv4();
        const response = await getAxiosInstance(newDeviceId).post(
            "https://chat.openai.com/backend-anon/sentinel/chat-requirements",
            {}
        );
        let session: Session = response.data as Session;
        session.deviceId = newDeviceId;

        res.status(200).json({
            status: true,
            data: session,
        });
    } catch (error: any) {
        if (!res.headersSent) res.setHeader("Content-Type", "application/json");
        let statusCode = 500;
        if (error.response) {
            if (error.response.status) statusCode = error.response.status;
            console.log("Error occured when getting data: ", error.response);
        }
        res.status(statusCode).json({
            status: false,
            error: {
                message: "An error occurred. please try again.",
                type: "invalid_request_error",
            },
        });
    }
}

const app = express();
app.use(bodyParser.json());
app.use(enableCORS);

app.get("/v1/new-openai-session", handleNewSession);

app.use((req, res) =>
    res.status(404).send({
        status: false,
        error: {
            message: `The requested endpoint (${req.method.toLocaleUpperCase()} ${
                req.path
            }) was not found. please make sure to use "http://localhost:3041/v1" as the base URL.`,
            type: "invalid_request_error",
        },
    })
);

app.listen(3041, async () => {
    console.log(`💡 Server is running at http://localhost:3041`);
    console.log(
        `🔗 Local Endpoint: http://localhost:3041/v1/new-openai-session`
    );
});
