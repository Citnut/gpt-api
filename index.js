const express = require("express")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
require("dotenv").config()
const { Configuration, OpenAIApi } = require("openai")
const { openai_key, port, host } = process.env
const app = express()
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
})
const configuration = new Configuration({
    apiKey: openai_key,
})
const openai = new OpenAIApi(configuration)
const defaultMSG = `use: ${host}:${port}/chatgpt?text=hello`

app.use(express.static("public"))
app.use(limiter)
app.use(cors())

function api() {
    app.get("/", (req, res) => {
        res.send(defaultMSG)
    })
    app.get("/chatgpt", async (req, res) => {
        const text = req.query.text
        let result = {}

        if (!text) {
            result.code = 404
            result.chatgpt = defaultMSG
            return res.send(JSON.stringify(result, null, 2))
        }
        const api_res = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: text,
            max_tokens: 2049 - text.length
        })

        if (api_res.status == 200) {
            result.code = 200
            result.chatgpt = api_res.data.choices[0].text
            res.send(JSON.stringify(result, null, 2))
        }

        res.header("Content-type", "application/json charset=utf-8")
    })
}

try {
    api()
} catch (e) {
    console.error(e)
    console.warn("restarting...")
    setTimeout(() => { api() }, 3000);
}

app.listen(port, "0.0.0.0", function () {
    console.log(`Server listening on port ${port}\n`)
})
