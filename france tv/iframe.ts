const iframe = new iFrame();

iframe.on("UpdateData", async () => {
    const times = document.querySelectorAll(".ftv-magneto-time");

    const parseTime = (text: string | null): number => {
        const parts = (text ?? "00:00:00").split(":").map(Number);
        while (parts.length < 3) parts.unshift(0);
        const [hh, mm, ss] = parts;
        return hh * 3600 + mm * 60 + ss;
    };

    const currentTime = parseTime(times[0]?.textContent?.trim() ?? null);
    const duration = parseTime(times[1]?.textContent?.trim() ?? null);

    const paused = document.querySelector("[aria-label^='Lecture']") !== null;

    iframe.send({
        currentTime,
        duration,
        paused
    });
});
