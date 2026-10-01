function formatTime(seconds) {
    if (seconds >= 3600) {
        const hours = Math.ceil(seconds / 3600);
        return `${hours} hour${hours > 1 ? "s" : ""}`
    }
    if (seconds >= 60) {
        const minutes = Math.ceil(seconds / 60);
        return `${minutes} minute${minutes > 1 ? "s" : ""}`
    }
    return `${seconds} second${seconds > 1 ? "s" : ""}`
}
module.exports = formatTime
