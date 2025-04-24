let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/songs/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/songs/${folder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
        <li>
            <img class="invert" width="34" src="img/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Faizfarid</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/songs/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    const response = await fetch("/songs/");
    const htmlText = await response.text();

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlText;

    const anchors = tempDiv.querySelectorAll("a");
    const cardContainer = document.querySelector(".cardContainer");

    for (let anchor of anchors) {
        let href = anchor.getAttribute("href");
        if (!href || href.includes(".") || href === "../") continue;

        let folder = href.replace(/\/$/, "").split("/").filter(Boolean).pop();
        if (!folder || folder === "songs") continue;

        try {
            const infoRes = await fetch(`/songs/${folder}/info.json`);
            if (!infoRes.ok) throw new Error(`HTTP ${infoRes.status}`);
            const info = await infoRes.json();

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
        } catch (err) {
            // failed to load album info
        }
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            let folder = card.dataset.folder;
            songs = await getSongs(folder);
            playMusic(songs[0]);
        });
    });
}

function handleVolumeScroll(e) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    let newVolume = currentSong.volume + delta;
    newVolume = Math.min(1, Math.max(0, newVolume));
    currentSong.volume = newVolume;
    document.querySelector(".range input").value = newVolume * 100;

    const volIcon = document.querySelector(".volume>img");
    if (newVolume === 0) {
        volIcon.src = volIcon.src.replace("volume.svg", "mute.svg");
    } else {
        if (volIcon.src.includes("mute.svg")) {
            volIcon.src = volIcon.src.replace("mute.svg", "volume.svg");
        }
    }
}

async function main() {
    await getSongs("ncs");
    playMusic(songs[0], true);
    await displayAlbums();

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        const volIcon = document.querySelector(".volume>img");
        if (currentSong.volume > 0) {
            volIcon.src = volIcon.src.replace("mute.svg", "volume.svg");
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.10;
            document.querySelector(".range input").value = 10;
        }
    });

    // Volume scroll on hover
    const volumeArea = document.querySelector(".volume");
    volumeArea.addEventListener("mouseenter", () => {
        volumeArea.addEventListener("wheel", handleVolumeScroll, { passive: false });
    });
    volumeArea.addEventListener("mouseleave", () => {
        volumeArea.removeEventListener("wheel", handleVolumeScroll);
    });

    // Keyboard controls
    document.addEventListener("keydown", e => {
        if (e.code === "Space") {
            e.preventDefault();
            if (currentSong.paused) {
                currentSong.play();
                play.src = "img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "img/play.svg";
            }
        } else if (e.code === "ArrowRight") {
            e.preventDefault();
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if ((index + 1) < songs.length) {
                playMusic(songs[index + 1]);
            }
        } else if (e.code === "ArrowLeft") {
            e.preventDefault();
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if ((index - 1) >= 0) {
                playMusic(songs[index - 1]);
            }
        } else if (e.code === "ArrowUp") {
            e.preventDefault();
            let newVolume = currentSong.volume + 0.05;
            currentSong.volume = Math.min(1, newVolume);
            document.querySelector(".range input").value = currentSong.volume * 100;
    
            const volIcon = document.querySelector(".volume>img");
            if (currentSong.volume > 0 && volIcon.src.includes("mute.svg")) {
                volIcon.src = volIcon.src.replace("mute.svg", "volume.svg");
            }
        } else if (e.code === "ArrowDown") {
            e.preventDefault();
            let newVolume = currentSong.volume - 0.05;
            currentSong.volume = Math.max(0, newVolume);
            document.querySelector(".range input").value = currentSong.volume * 100;
    
            const volIcon = document.querySelector(".volume>img");
            if (currentSong.volume === 0 && volIcon.src.includes("volume.svg")) {
                volIcon.src = volIcon.src.replace("volume.svg", "mute.svg");
            }
        }
    });
    
}

main();
