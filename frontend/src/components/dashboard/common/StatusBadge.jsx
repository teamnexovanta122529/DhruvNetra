export default function StatusBadge({
    status = "NORMAL",
    type = "normal",
}) {
    return (
        <span className={`status-badge ${type}`}>
            <i />
            {status}
        </span>
    );
}