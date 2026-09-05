export default function MetricCard({
    label,
    value,
    unit = "",
    status,
    trend,
}) {
    return (
        <div className="metric-card">

            <div className="metric-card-top">
                <span>{label}</span>

                {status && (
                    <span className="metric-status">
                        {status}
                    </span>
                )}
            </div>

            <div className="metric-value">
                {value}
                {unit && (
                    <small>{unit}</small>
                )}
            </div>

            {trend && (
                <div className="metric-trend">
                    {trend}
                </div>
            )}

        </div>
    );
}