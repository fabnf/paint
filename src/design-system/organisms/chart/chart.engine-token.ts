import { InjectionToken } from '@angular/core';
import type { ChartAdapter } from './chart.types';

/**
 * The engine a host has configured, if any.
 *
 * It lives in its own tiny file so `<ds-chart>` can *ask* for a real engine
 * without importing the module that knows how to build one — which is what
 * keeps Highcharts out of anything that merely renders a chart. The provider is
 * `provideCharts()`, in the deep-imported `highcharts.adapter` file; with no
 * provider the organism falls back to the mock plate.
 */
export const DS_CHART_ENGINE = new InjectionToken<ChartAdapter>('DS_CHART_ENGINE');