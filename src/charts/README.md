# charts

LineChart and AreaChart are the only public runtime components.
CartesianPointInspection owns shared point controls, tooltips, corrected activation
and conservative client animation. Pure math stays in core; shared orchestration
stays in internal/CartesianPointRenderer. Area polygon inspection is out of scope.
See [LineChart](../../docs/LINE_CHART.md) and [AreaChart](../../docs/AREA_CHART.md).
