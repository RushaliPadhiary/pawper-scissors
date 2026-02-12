(() => {
    /* ---constants--- */
    const TOTAL_ROUNDS = 7;
    const ROUND_INTRO_MS = 4000;
    const RESULT_SHOW_MS = 4000;
    const TIMER_SECONDS = 10;

    const MOVES = ['stone', 'paper', 'scissor'];
    const BEATS = { stone: 'scissor', paper: 'stone', scissor: 'paper' };
    const LOSES_TO = { stone: 'paper', paper: 'scissor', scissor: 'stone' };

    const MOVIES = [
        { title: 'Ponyo', link: 'https://letterboxd.com/film/ponyo/' },
        { title: 'Little Forest', link: 'https://letterboxd.com/film/little-forest/'},
        { title: '50 first dates', link: 'https://letterboxd.com/film/50-first-dates/'},
        { title: 'The vow', link: 'https://letterboxd.com/film/the-vow/'},
        { title: 'Me Before You', link: 'https://letterboxd.com/film/me-before-you/'},
        { title: 'How to lose a guy in 10days', link: 'https://letterboxd.com/film/how-to-lose-a-guy-in-10-days/'},
        { title: 'La La Land', link: 'https://letterboxd.com/film/la-la-land/'},
        { title: 'Weathering with you', link: 'https://letterboxd.com/film/weathering-with-you/'},
        { title: 'I wanna eat your pancreas', link: 'https://letterboxd.com/film/i-want-to-eat-your-pancreas/'},
        { title: 'Lemme pick smthg else <3', link: 'https://letterboxd.com/films/'}
    ];

    /* ---assets--- */
    const img = (name) => `assets/images/${name}.png`;
    const gif = (name) => `assets/animations/${name}.gif`;

    /* ---DOM refs--- */
    const $landing = document.getElementById('landing');
    const $dialog = document.getElementById('dialog');
    const $btnBringItOn = document.getElementById('btn-bring-it-on');

    const $overlay = document.getElementById('game-overlay');
    const $hud = document.getElementById('hud');
    const $hudStats = document.getElementById('hud-stats');
    const $hudTimer = document.getElementById('hud-timer');
    const $hudRound = document.getElementById('hud-round');
    const $roundIntro = document.getElementById('round-intro');

    const $arena = document.getElementById('arena');
    const $pawYou = document.getElementById('paw-you');
    const $pawMe = document.getElementById('paw-me');
    const $resultDisplay = document.getElementById('result-display');
    const $resultGif = document.getElementById('result-gif');

    const $choices = document.getElementById('choices');
    const $choiceStone = document.getElementById('choice-stone');
    const $choicePaper = document.getElementById('choice-paper');
    const $choiceScissor = document.getElementById('choice-scissor');

    const $winDialog = document.getElementById('win-dialog');
    const $btnClaim = document.getElementById('btn-claim');

    const $movieDialog = document.getElementById('movie-dialog');
    const $movieLabel = document.getElementById('movie-label');
    const $remaining = document.getElementById('remaining-picks');
    const $btnMovie = document.getElementById('btn-movie');
    const $btnRefresh = document.getElementById('btn-refresh');

    /* ---state--- */
    let round = 1;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let timerSec = TIMER_SECONDS;
    let timerHandle = null;
    let pickMade = false;
    let movieIndex = 0;
    let moviePicks = 10;

    /* ---Event Listeners--- */
    function initEventListeners() {
        // Bring it on button
        $btnBringItOn.addEventListener('click', handleBringItOn);
        
        // Choice buttons - FIXED: Using correct attribute name
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (pickMade) return;
                const choice = e.currentTarget.getAttribute('data-choices');
                onUserPick(choice);
            });
        });
        
        // Claim button
        $btnClaim.addEventListener('click', handleClaim);
        
        // Refresh button
        $btnRefresh.addEventListener('click', handleRefresh);
        
        // Movie button
        $btnMovie.addEventListener('click', handleMovie);
    }

    function handleBringItOn() {
        $dialog.classList.add('poof');
        setTimeout(() => {
            $landing.classList.add('hidden');
            $dialog.classList.add('hidden');
            startGame();
        }, 450);
    }

    function handleClaim() {
        $winDialog.classList.add('poof');
        setTimeout(() => {
            $winDialog.classList.add('hidden');
            showMoviePicker();
        }, 450);
    }

    function handleRefresh() {
        if (movieIndex < MOVIES.length - 1) {
            movieIndex++;
            moviePicks--;
            updateMovieUI();

        } else if (movieIndex === MOVIES.length - 1) {
            // When at last movie, reset to first movie
            movieIndex = 0;
            moviePicks = MOVIES.length; // Reset picks counter
            updateMovieUI();
        }
    }

    function handleMovie() {

    const link = MOVIES[movieIndex].link;

    // Force external opening for Electron
    if (typeof require !== 'undefined' && require('electron')) {
        // Running in Electron - open in default browser
        const { shell } = require('electron');
        shell.openExternal(link);
    } else {
        // Running in browser - normal redirect
        window.open(link, '_blank');
    }
}

    /* ---Round Intro--- */
    function startGame() {
        round = 1;
        wins = draws = losses = 0;
        showRoundIntro();
    }

    function showRoundIntro() {
        //Show overlay, hide HUD & choices
        $overlay.classList.remove('hidden', 'fade-out');
        $hud.classList.add('hidden');
        $choices.classList.add('hidden');
        $resultDisplay.classList.add('hidden');
        $roundIntro.classList.remove('hidden');

        //Reset paws to stone+bounce animation
        setPaw('you', 'stone');
        setPaw('me', 'stone');
        $pawYou.classList.add('bounce');
        $pawMe.classList.add('bounce');

        $roundIntro.textContent = `ROUND ${round}`;

        setTimeout(() => {
            $roundIntro.classList.add('hidden');
            startGameplay();
        }, ROUND_INTRO_MS);
    }

    /* ---Gameplay--- */
    function startGameplay() {
        pickMade = false;

        //Show HUD
        $hud.classList.remove('hidden', 'fade-out');
        updateHUD();

        //Reset choice buttons to active states
        $choiceStone.src = img('Date_stone');
        $choicePaper.src = img('Date_paper');
        $choiceScissor.src = img('Date_scissor');
        document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('disabled'));
        $choices.classList.remove('hidden');

        //Start timer
        timerSec = TIMER_SECONDS;
        renderTimer();
        timerHandle = setInterval(() => {
            timerSec--;
            renderTimer();
            if(timerSec <= 0) {
                clearInterval(timerHandle);
                if (!pickMade) autoPickForUser();
            }
        }, 1000);
    }

    function updateHUD() {
        $hudStats.textContent = `Wins: ${wins} | Draws: ${draws} | Losses: ${losses}`;
        $hudRound.textContent = `Round: ${round}`;
    }

    function renderTimer() {
        const s = String(Math.max(timerSec, 0)).padStart(2, '0');
        $hudTimer.textContent = `Timer: 00:${s}`;
    }

    function autoPickForUser() {
        const choice = MOVES[Math.floor(Math.random() * 3)];
        onUserPick(choice);   
    }

    function onUserPick(userChoice) {
        if (pickMade) return;
        pickMade = true;
        clearInterval(timerHandle);

        timerSec = 0;
        renderTimer();

        // Disable & grey-out unselected buttons
        const inactiveMap = { stone: 'Date_stoneinactive', paper: 'Date_paperinactive', scissor: 'Date_scissorinactive' };
        MOVES.forEach(m => {
            const el = document.getElementById(`choice-${m}`);
            if (m !== userChoice) {
                el.src = img(inactiveMap[m]);
            }
            el.closest('.choice-btn').classList.add('disabled');
        });

        const meChoice = riggedPick(userChoice);

        setPaw('you', userChoice);
        setPaw('me', meChoice);
        $pawYou.classList.remove('bounce');
        $pawMe.classList.remove('bounce');

        const result = getResult(userChoice, meChoice);

        if (result === 'win')  wins++;
        if (result === 'draw') draws++;
        if (result === 'lose') losses++;
        updateHUD();

        setTimeout(() => showResultGif(result), 600);
    }

    /* ---------- rigging ---------- */
    function riggedPick(userChoice) {
        const remainingRounds = TOTAL_ROUNDS - round;
        const winsNeeded = Math.floor(TOTAL_ROUNDS / 2) + 1;

        if (remainingRounds === 0 && wins < losses + 1) {
            return BEATS[userChoice];
        }

        const deficit = losses - wins;
        let winChance  = 0.60;
        let drawChance = 0.25;

        if (deficit >= 2) {
            winChance  = 0.80;
            drawChance = 0.12;
        } else if (wins >= winsNeeded) {
            winChance  = 0.35;
            drawChance = 0.30;
        }

        const roll = Math.random();
        if (roll < winChance) {
            return BEATS[userChoice];
        } else if (roll < winChance + drawChance) {
            return userChoice;
        } else {
            return LOSES_TO[userChoice];
        }
    }

    function getResult(userChoice, meChoice) {
        if (userChoice === meChoice) return 'draw';
        if (BEATS[userChoice] === meChoice) return 'win';
        return 'lose';
    }

    /* ---------- result gif ---------- */
    function showResultGif(result) {
        let gifName;
        if (result === 'draw') {
            gifName = Math.random() < 0.5 ? 'draw1' : 'draw2';
        } else if (result === 'win') {
            gifName = ['mewin1', 'mewin2'][Math.floor(Math.random() * 2)];
        } else {
            gifName = ['hewin1', 'hewin2', 'hewin3'][Math.floor(Math.random() * 3)];
        }

        $resultGif.src = gif(gifName) + '?t=' + Date.now();
        $resultDisplay.classList.remove('hidden');

        setTimeout(() => {
            $resultDisplay.classList.add('hidden');
            advanceRound();
        }, RESULT_SHOW_MS);
    }

    function advanceRound() {
        round++;
        if (round > TOTAL_ROUNDS) {
            endGame();
        } else {
            showRoundIntro();
        }
    }

    /* ---Win Dialog--- */
    function endGame() {
        $hud.classList.add('fade-out');
        $choices.classList.add('hidden');
        $overlay.classList.add('fade-out');
        $arena.style.opacity = '0';
        $arena.style.transition = 'opacity 0.8s ease';

        setTimeout(() => {
            $arena.style.opacity = '0';
            $arena.style.transition = '';
            showWinDialog();
        }, 900);
    }

    function showWinDialog() {
        $winDialog.classList.remove('hidden');
        $winDialog.style.zIndex = '200';
    }

    /* ---Movie Picker--- */
    function showMoviePicker() {
        movieIndex = 0;
        moviePicks = MOVIES.length;
        updateMovieUI();
        $movieDialog.classList.remove('hidden');
    }

    function updateMovieUI() {
    $movieLabel.textContent = MOVIES[movieIndex].title;
    $remaining.textContent = `Remaining picks: ${moviePicks}/${MOVIES.length}`;
    
    const btnLabel = $btnMovie.querySelector('.btn-label');
    const currentMovie = MOVIES[movieIndex].title;
    
    btnLabel.textContent = currentMovie;
    
    // Remove existing classes
    btnLabel.classList.remove('long', 'short');
    
    if (currentMovie.length > 18) {
        btnLabel.classList.add('long');
    } else if (currentMovie.length <= 15) {
        btnLabel.classList.add('short');
    }
}

    /* ---Helpers--- */
    function setPaw(side, move) {
        const el = side === 'you' ? $pawYou : $pawMe;
        const prefix = side === 'you' ? 'cat1' : 'cat2';
        el.src = img(`${prefix}_${move}`);
    }

    /* ---Initialize--- */
    initEventListeners();
})();