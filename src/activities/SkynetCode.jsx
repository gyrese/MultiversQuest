import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIG ---
const ROWS = 5;
const COLS = 5;

// Tile Types: 0: None, 1: Straight, 2: Corner, 3: T-Junction, 4: Cross
// Connections: Top, Right, Bottom, Left (Binary: 1, 2, 4, 8)
const TILE_Types = {
    0: { type: 'empty', connect: 0, label: ' ' },
    1: { type: 'straight', connect: 5, label: '│' }, // 0101 (Top+Bottom)
    2: { type: 'corner', connect: 3, label: '└' }, // 0011 (Top+Right) -> Render as L
    3: { type: 't', connect: 7, label: '┴' }, // 0111 (Top+Right+Bottom)
    4: { type: 'cross', connect: 15, label: '┼' }, // 1111 (All)
};

const LEVELS = [
    {
        id: 1,
        start: { r: 0, c: 0, dir: 4 }, // Start at top-left, pointing Down (4)
        end: { r: 4, c: 4, dir: 1 }, // End at bottom-right, expecting input from Top (1)
        grid: [
            [2, 1, 2, 0, 0],
            [1, 0, 1, 2, 1],
            [2, 1, 4, 1, 2],
            [0, 2, 1, 0, 1],
            [0, 0, 2, 1, 2]
        ]
    }
];

export default function SkynetCode({ onComplete, onExit }) {
    const [grid, setGrid] = useState([]);
    const [startPos, setStartPos] = useState(LEVELS[0].start);
    const [endPos, setEndPos] = useState(LEVELS[0].end);
    const [connectedPath, setConnectedPath] = useState([]);
    const [gameWon, setGameWon] = useState(false);
    const [isCompiling, setIsCompiling] = useState(false);

    useEffect(() => {
        // Init Level
        const level = LEVELS[0];
        const newGrid = level.grid.map(row =>
            row.map(typeId => ({
                typeId,
                rotation: Math.floor(Math.random() * 4), // Random initial rotation
                active: false
            }))
        );
        setGrid(newGrid);
        setStartPos(level.start);
        setEndPos(level.end);
    }, []);

    const rotateTile = (r, c) => {
        if (gameWon || isCompiling) return;
        const newGrid = [...grid];
        newGrid[r][c].rotation = (newGrid[r][c].rotation + 1) % 4;
        setGrid(newGrid);
        // Maybe auto-check? No, manual compile is more dramatic.
    };

    // Helper: Logic to get connections based on rotation
    const getConnections = (tile) => {
        const base = TILE_Types[tile.typeId].connect;
        // Right shift rotate based on rotation
        // 0: 0, 1: 90 (Right), 2: 180, 3: 270
        // Connections: 1(Top), 2(Right), 4(Bottom), 8(Left)

        let conn = base;
        for (let i = 0; i < tile.rotation; i++) {
            // Rotate bits: 1->2, 2->4, 4->8, 8->1
            let newConn = 0;
            if (conn & 1) newConn |= 2;
            if (conn & 2) newConn |= 4;
            if (conn & 4) newConn |= 8;
            if (conn & 8) newConn |= 1;
            conn = newConn;
        }
        return conn;
    };

    const handleCompile = () => {
        setIsCompiling(true);
        // BFS/DFS to trace flow from Start

        let queue = [{ r: startPos.r, c: startPos.c, fromDir: startPos.dir }]; // fromDir is opposite of flow
        let visited = new Set();
        let path = [];
        let reachedEnd = false;

        // Trace logic (simplified)
        // ... honestly, standard BFS visual implementation is complex.
        // Let's do instant check, then animate.

        // Actually, let's just trace recursively.
        const trace = (currR, currC, entryDir, currentPath) => { // entryDir: 1=Top, 2=Right, 4=Bottom, 8=Left (where we came FROM)
            const key = `${currR},${currC}`;
            if (visited.has(key)) return;
            visited.add(key);
            currentPath.push({ r: currR, c: currC });

            if (currR === endPos.r && currC === endPos.c) {
                // Check if end accepts entryDir
                // For level 1, End expects input from Top (1). If we enter from Top, entryDir = 1.
                // Wait, logic is "Where flow is GOING".
                // If Start is (0,0) and dir=4 (Bottom), it flows into (1,0) from TOP.
                reachedEnd = true;
                return;
            }

            const tile = grid[currR][currC];
            const conns = getConnections(tile);

            // Check if current tile accepts flow from entryDir (reverse of entry)
            // entryDir is where we are ENTERING. e.g. entering (0,0) from nowhere (start).
            // Actually start is a source. It flows OUT.

            // Directions: 1:Up, 2:Right, 4:Down, 8:Left
            // If current tile has Up (1), it connects to neighbor at (r-1, c) which must have Down (4).

            const directions = [
                { dir: 1, dr: -1, dc: 0, opp: 4 }, // UP
                { dir: 2, dr: 0, dc: 1, opp: 8 },  // RIGHT
                { dir: 4, dr: 1, dc: 0, opp: 1 },  // DOWN
                { dir: 8, dr: 0, dc: -1, opp: 2 }  // LEFT
            ];

            // For current tile, try to flow to neighbors
            for (let d of directions) {
                if (conns & d.dir) {
                    // Start exception: Start is virtual, let's assume valid flow if connected
                    const nextR = currR + d.dr;
                    const nextC = currC + d.dc;

                    if (nextR >= 0 && nextR < ROWS && nextC >= 0 && nextC < COLS) {
                        const nextTile = grid[nextR][nextC];
                        const nextConns = getConnections(nextTile);

                        // Check if neighbor connects back
                        if (nextConns & d.opp) {
                            if (!visited.has(`${nextR},${nextC}`)) {
                                trace(nextR, nextC, d.opp, [...currentPath]);
                                if (reachedEnd) return;
                            }
                        }
                    }
                }
            }
        };

        // This is getting complicated to simulate perfectly in one shot. 
        // Let's simplify: Just visually check if there is A valid path from Start to End.
        // Flood fill.

        // Let's implement a simpler "Propagate Flow"
        let activeSet = new Set();
        let q = [{ r: startPos.r, c: startPos.c }];

        const loop = () => {
            // ... actually scratch that. Let's just fake it till we make it for the MVP.
            // If Start connects to neighbor, and neighbor connects...
            // Let's just assume if End is reached, we win.

            // Simple recursive check
            const seen = new Set();
            const check = (r, c) => {
                if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
                const k = `${r},${c}`;
                if (seen.has(k)) return false;
                seen.add(k);

                if (r === endPos.r && c === endPos.c) return true;

                const t = grid[r][c];
                const bits = getConnections(t);

                // Check Up
                if ((bits & 1) && r > 0) {
                    const up = grid[r - 1][c];
                    if (getConnections(up) & 4) { if (check(r - 1, c)) return true; }
                }
                // Check Right
                if ((bits & 2) && c < COLS - 1) {
                    const right = grid[r][c + 1];
                    if (getConnections(right) & 8) { if (check(r, c + 1)) return true; }
                }
                // Check Down
                if ((bits & 4) && r < ROWS - 1) {
                    const down = grid[r + 1][c];
                    if (getConnections(down) & 1) { if (check(r + 1, c)) return true; }
                }
                // Check Left
                if ((bits & 8) && c > 0) {
                    const left = grid[r][c - 1];
                    if (getConnections(left) & 2) { if (check(r, c - 1)) return true; }
                }
                return false;
            };

            const success = check(startPos.r, startPos.c);

            if (success) {
                setGameWon(true);
                setTimeout(() => onComplete(600), 2000);
            } else {
                setIsCompiling(false);
                alert("ERREUR COMPILATION: FLUX INTERROMPU"); // Replace with nicer UI later
            }
        }

        setTimeout(loop, 1000); // Fake processing delay
    };

    return (
        <div className="fixed inset-0 bg-[#050510] text-cyan-500 font-mono select-none flex flex-col items-center justify-center">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="z-10 bg-black/80 border border-cyan-500/50 p-6 rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                <div className="text-center mb-4 border-b border-cyan-900 pb-2">
                    <h2 className="text-xl font-bold tracking-widest text-cyan-400">SKYNET_CORE</h2>
                    <p className="text-xs text-cyan-700">KERNEL ACCESS: RESTRICTED</p>
                </div>

                <div
                    className="grid gap-1 bg-cyan-900/20 p-1 border border-cyan-800"
                    style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
                >
                    {grid.map((row, r) => row.map((tile, c) => {
                        const isStart = r === startPos.r && c === startPos.c;
                        const isEnd = r === endPos.r && c === endPos.c;

                        return (
                            <motion.button
                                key={`${r}-${c}`}
                                onClick={() => rotateTile(r, c)}
                                animate={{ rotate: tile.rotation * 90 }}
                                className={`w-12 h-12 relative flex items-center justify-center bg-black border border-cyan-900/50 ${gameWon ? 'bg-cyan-900/40 text-white' : 'hover:bg-cyan-900/20'}`}
                            >
                                {/* Simple SVG Pipes */}
                                <svg viewBox="0 0 100 100" className={`w-full h-full ${gameWon ? 'stroke-white' : 'stroke-cyan-500'}`} fill="none" strokeWidth="8" strokeLinecap="square">
                                    {tile.typeId === 1 && <line x1="50" y1="0" x2="50" y2="100" />}
                                    {tile.typeId === 2 && <path d="M50,0 L50,50 L100,50" />}
                                    {tile.typeId === 3 && <path d="M50,0 L50,50 M0,50 L100,50" />}
                                    {tile.typeId === 4 && <path d="M50,0 L50,100 M0,50 L100,50" />}
                                </svg>

                                {isStart && <div className="absolute inset-0 bg-green-500/30 animate-pulse border border-green-500" />}
                                {isEnd && <div className="absolute inset-0 bg-red-500/30 border border-red-500" />}
                            </motion.button>
                        );
                    }))}
                </div>

                <div className="mt-6 flex justify-between items-center">
                    <button onClick={onExit} className="text-xs text-red-500 border border-red-900 px-3 py-1 hover:bg-red-900/20">
                        ABORT
                    </button>
                    <button
                        onClick={handleCompile}
                        disabled={isCompiling || gameWon}
                        className={`px-6 py-2 bg-cyan-600 text-black font-bold text-sm tracking-widest hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isCompiling ? 'COMPILING...' : 'EXECUTE'}
                    </button>
                </div>
            </div>

            {gameWon && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/90 z-50">
                    <h1 className="text-4xl font-bold text-white mb-2">ACCESS GRANTED</h1>
                    <p className="text-cyan-200 animate-pulse">Skynet Online.</p>
                </div>
            )}
        </div>
    );
}
