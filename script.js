function Initialize(onComplete) {
    if (!!window.SpeechSDK) {
        document.getElementById('content').style.display = 'block';
        document.getElementById('warning').style.display = 'none';
        onComplete(window.SpeechSDK);
    }
}

// subscription key and region for speech services.
var subscriptionKey, regionOptions;
var authorizationToken;
var voiceOptions, isSsml;
var SpeechSDK;
var synthesisText;
var synthesizer;
var player;
var wordBoundaryList = [];

function getExtensionFromFormat(format) {
    format = format.toLowerCase();
    if (format.includes('mp3')) {
        return 'mp3';
    } else if (format.includes('ogg')) {
        return 'ogg';
    } else if (format.includes('webm')) {
        return 'webm';
    } else if (format.includes('ogg')) {
        return 'ogg';
    } else if (format.includes('silk')) {
        return 'silk';
    } else if (format.includes('riff')) {
        return 'wav'; voice
    } else {
        return 'pcm';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    startSynthesisAsyncButton = document.getElementById("startSynthesisAsyncButton");
    pauseButton = document.getElementById("pauseButton");
    resumeButton = document.getElementById("resumeButton");
    downloadButton = document.getElementById("downloadButton");
    subscriptionKey = "2b2c5d0662ff4ecdaf08396f028475f8";
    regionOptions = 'brazilsouth';
    resultsDiv = document.getElementById("resultsDiv");
    eventsDiv = document.getElementById("eventsDiv");
    voiceOptions = 'Microsoft Server Speech Text to Speech Voice (pt-BR, FranciscaNeural)';
    isSsml = false;
    highlightDiv = document.getElementById("highlightDiv");

    pauseButton.addEventListener("click", function () {
        player.pause();
        pauseButton.disabled = true;
        resumeButton.disabled = false;
    });

    resumeButton.addEventListener("click", function () {
        player.resume();
        pauseButton.disabled = false;
        resumeButton.disabled = true;
    });

    startSynthesisAsyncButton.addEventListener("click", function () {
        resultsDiv.innerHTML = "";
        eventsDiv.innerHTML = "";
        wordBoundaryList = [];
        synthesisText = document.getElementById("synthesisText");

        // if we got an authorization token, use the token. Otherwise use the provided subscription key
        var speechConfig;
        if (authorizationToken) {
            speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(authorizationToken, regionOptions);
        } else {
            if (subscriptionKey === "" || subscriptionKey === "subscription") {
                alert("Please enter your Microsoft Cognitive Services Speech subscription key!");
                return;
            }
            speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, regionOptions);
        }

        speechConfig.speechSynthesisVoiceName = voiceOptions;
        speechConfig.speechSynthesisOutputFormat = formatOptions.value;

        player = new SpeechSDK.SpeakerAudioDestination();
        player.onAudioStart = function (_) {
            window.console.log("playback started");
            setTimeout(function () { $("svg path :first-child").each(function (i) { this.beginElement(); }); }, 0.5);
        }
        player.onAudioEnd = function (_) {
            window.console.log("playback finished");
            eventsDiv.innerHTML += "playback finished" + "\r\n";
            startSynthesisAsyncButton.disabled = false;
            downloadButton.disabled = false;
            pauseButton.disabled = true;
            resumeButton.disabled = true;
            wordBoundaryList = [];
        };

        var audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(player);

        synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

        // The event synthesizing signals that a synthesized audio chunk is received.
        // You will receive one or more synthesizing events as a speech phrase is synthesized.
        // You can use this callback to streaming receive the synthesized audio.
        synthesizer.synthesizing = function (s, e) {
            window.console.log(e);
            eventsDiv.innerHTML += "(synthesizing) Reason: " + SpeechSDK.ResultReason[e.result.reason] +
                "Audio chunk length: " + e.result.audioData.byteLength + "\r\n";
        };

        // The synthesis started event signals that the synthesis is started.
        synthesizer.synthesisStarted = function (s, e) {
            window.console.log(e);
            eventsDiv.innerHTML += "(synthesis started)";
            pauseButton.disabled = false;
        };

        // The event synthesis completed signals that the synthesis is completed.
        synthesizer.synthesisCompleted = function (s, e) {
            console.log(e);
            eventsDiv.innerHTML += "(synthesized)  Reason: " + SpeechSDK.ResultReason[e.result.reason] +
                " Audio length: " + e.result.audioData.byteLength + "\r\n";
        };

        // The event signals that the service has stopped processing speech.
        // This can happen when an error is encountered.
        synthesizer.SynthesisCanceled = function (s, e) {
            const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(e.result);
            let str = "(cancel) Reason: " + SpeechSDK.CancellationReason[cancellationDetails.reason];
            if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
                str += ": " + e.result.errorDetails;
            }
            window.console.log(e);
            eventsDiv.innerHTML += str + "\r\n";
            startSynthesisAsyncButton.disabled = false;
            downloadButton.disabled = false;
            pauseButton.disabled = true;
            resumeButton.disabled = true;
        };

        // This event signals that word boundary is received. This indicates the audio boundary of each word.
        // The unit of e.audioOffset is tick (1 tick = 100 nanoseconds), divide by 10,000 to convert to milliseconds.




        const complete_cb = function (result) {
            if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                resultsDiv.innerHTML += "synthesis finished";
            } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
                resultsDiv.innerHTML += "synthesis failed. Error detail: " + result.errorDetails;
            }
            window.console.log(result);
            synthesizer.close();
            synthesizer = undefined;
        };
        const err_cb = function (err) {
            startSynthesisAsyncButton.disabled = false;
            downloadButton.disabled = false;
            phraseDiv.innerHTML += err;
            window.console.log(err);
            synthesizer.close();
            synthesizer = undefined;
        };


        startSynthesisAsyncButton.disabled = true;
        downloadButton.disabled = true;

        if (isSsml.value) {
            synthesizer.speakSsmlAsync(synthesisText.value,
                complete_cb,
                err_cb);
        } else {
            synthesizer.speakTextAsync(synthesisText.value,
                complete_cb,
                err_cb);
        }
    });

    downloadButton.addEventListener("click", function () {
        resultsDiv.innerHTML = "";
        eventsDiv.innerHTML = "";
        synthesisText = document.getElementById("synthesisText");

        var speechConfig;

        // if we got an authorization token, use the token. Otherwise use the provided subscription key
        if (authorizationToken) {
            speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(authorizationToken, regionOptions);
        } else {
            if (subscriptionKey === "" || subscriptionKey === "subscription") {
                alert("Please enter your Microsoft Cognitive Services Speech subscription key!");
                return;
            }
            speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, regionOptions);
        }

        speechConfig.speechSynthesisVoiceName = voiceOptions;
        speechConfig.speechSynthesisOutputFormat = formatOptions.value;

        synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);

        synthesizer.SynthesisCanceled = function (s, e) {
            const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(e.result);
            let str = "(cancel) Reason: " + SpeechSDK.CancellationReason[cancellationDetails.reason];
            if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
                str += ": " + e.result.errorDetails;
            }
            window.console.log(e);
            eventsDiv.innerHTML += str + "\r\n";
            resultsDiv.innerHTML = str;
            startSynthesisAsyncButton.disabled = false;
            downloadButton.disabled = false;
            pauseButton.disabled = true;
            resumeButton.disabled = true;
        };

        synthesizer.synthesisCompleted = function (s, e) {
            resultsDiv.innerHTML = "synthesis finished";
            synthesizer.close();
            a = document.createElement('a');
            url = window.URL.createObjectURL(new Blob([e.result.audioData]));
            a.href = url;
            a.download = 'synth.' + getExtensionFromFormat(formatOptions.options[formatOptions.selectedIndex].text);
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
            startSynthesisAsyncButton.disabled = false;
            downloadButton.disabled = false;
        };

        if (!synthesisText.value) {
            alert("Please enter synthesis content.");
        }

        startSynthesisAsyncButton.disabled = true;
        downloadButton.disabled = true;

        if (isSsml.value) {
            synthesizer.speakSsmlAsync(synthesisText.value);
        } else {
            synthesizer.speakTextAsync(synthesisText.value);
        }
    });

    Initialize(function (speechSdk) {
        SpeechSDK = speechSdk;
        startSynthesisAsyncButton.disabled = false;
        downloadButton.disabled = false;
        pauseButton.disabled = true;
        resumeButton.disabled = true;

        formatOptions.innerHTML = "";
        Object.keys(SpeechSDK.SpeechSynthesisOutputFormat).forEach(format => {
            if (isNaN(format) && !format.includes('Siren')) {
                formatOptions.innerHTML += "<option value=\"" + SpeechSDK.SpeechSynthesisOutputFormat[format] + "\">" + format + "</option>"
            }
        }
        );
        formatOptions.selectedIndex = SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

        // in case we have a function for getting an authorization token, call it.
        if (typeof RequestAuthorizationToken === "function") {
            RequestAuthorizationToken();
        }
    });
});