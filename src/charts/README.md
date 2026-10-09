# charts

LineChart is the sole public runtime component. LineInspection owns point controls,
tooltip presentation, activation and conservative client animation. Pure geometry
stays in core; shared frame/layout/table orchestration stays in internal/LineRenderer.
See [LineChart](../../docs/LINE_CHART.md). Other chart families remain deferred.
