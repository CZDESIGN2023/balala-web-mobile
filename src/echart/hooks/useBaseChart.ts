import * as echarts from 'echarts/core'
import {
  DataZoomComponent,
  GridComponent,
  type GridComponentOption,
  LegendComponent,
  MarkPointComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import type { ProjectModuleListItem } from '@/api/interface'

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  CanvasRenderer,
  UniversalTransition,
  DataZoomComponent,
  MarkPointComponent,
  LegendComponent,
  SVGRenderer,
])

type EChartsOption = echarts.ComposeOption<GridComponentOption | BarSeriesOption>

class FormatData {
  public data: ProjectModuleListItem[]
  constructor(data: ProjectModuleListItem[]) {
    this.data = data
  }

  public getData() {
    const xAxisData: string[] = []
    const completedData: number[] = []
    const todoData: number[] = []
    const emptyData: number[] = []
    this.data.forEach((item) => {
      xAxisData.push(item.workObjectName)
      const completed = (
        ((Number(item.total) - Number(item.processing)) / Number(item.total))
        * 1000
      ).toFixed(0)
      const todo = 1000 - Number(completed)
      completedData.push(Number(completed))
      todoData.push(todo)
      if (item.total === '0' && todo !== 0)
        emptyData.push(1000)
      else
        emptyData.push(0)
    })
    return { xAxisData, completedData, todoData, emptyData }
  }
}

export function useBaseChart(chartDom: HTMLElement, data: ProjectModuleListItem[], option = {}) {
  const myChart = echarts.init(chartDom) || null
  const formatData = new FormatData(data).getData()
  const series: any = [
    {
      name: '已完成任务',
      type: 'bar',
      stack: 'total',
      barWidth: '16px',
      label: {
        show: false,
      },
      data: formatData.completedData,
    },
    {
      name: '待办任务',
      type: 'bar',
      stack: 'total',
      barWidth: '16px',
      label: {
        show: false,
      },
      data: formatData.todoData,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
    },
    {
      name: '暂无任务',
      type: 'bar',
      stack: 'total',
      barWidth: '16px',
      label: {
        show: false,
      },
      data: formatData.emptyData,

      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        // 鼠标悬停时柱子的颜色
        emphasis: {
          color: '#EDEEF0',
        },
      },
    },
  ]

  const dataZoomEnd = data.length <= 12 ? 100 : (12 / data.length) * 100

  const initOption: EChartsOption = {
    title: {
      text: '模块任务分布图',
      left: '38%',
      textStyle: {
        color: '#333',
        fontSize: 12,
        fontWeight: 400,
      },
    },
    color: ['#00A773', '#FFAA33', '#f5f6f7'],
    tooltip: {
      trigger: 'item',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      padding: [0, 0, 0, 0],
      borderWidth: 0,
      borderRadius: 8,
      confine: true,
      enterable: true,
      formatter(value: any) {
        const rawData = data[value.dataIndex]
        let result = 0
        switch (value.seriesIndex) {
          case 1:
            result = Number(rawData.processing)
            break
          case 0:
            result = Number(rawData.total) - Number(rawData.processing)
        }
        return `
          <div class="custom-echart-tooltip">
            <div class="label">${rawData.workObjectName}</div>
            <div class="value">
              <p class="circle" style="background: ${value.color}"></p>
              <p class="text">
                ${value.seriesName}
                <span>${result}</span>
              </p>
            </div>
          </div>
        `
      },
    },
    grid: {
      left: '0%',
      right: '0%',
      bottom: '3%',
      top: '14.5%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: formatData.xAxisData,
        axisLine: {
          lineStyle: {
            type: 'dashed',
            color: '#edeef0',
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          interval: 0,
          width: 70,
          lineHeight: 20,
          overflow: 'truncate',
          color: '#999999',
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          formatter() {
            return ''
          },
        },
        axisLine: {
          // y轴线条样式
          lineStyle: {
            color: '#EDEEF0',
            type: 'dashed',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#EDEEF0',
            type: 'dashed',
          },
        },
      },
    ],
    legend: {
      left: '47.5%',
      selectedMode: false,
      itemHeight: 12,
      itemWidth: 12,
      textStyle: {
        color: '#999999',
        fontSize: 12,
      },
    },
    series,
  }

  if (data.length > 12) {
    initOption.dataZoom = [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        showDetail: false,
        start: 0,
        end: dataZoomEnd,
        width: 'auto',
        height: 8,
        left: 6,
        right: 4,
        bottom: 0,
        borderRadius: 0,
        borderColor: '#fff',
        brushSelect: false,
        fillerColor: '#E2E3E5',
        handleIcon: 'path://M2,0A2,2,0,1,1,-2,0A2,2,0,1,1,2,0Z',
        handleSize: '50%',
        handleStyle: {
          borderWidth: 1,
          color: '#e2e3e5',
          borderColor: '#e2e3e5',
        },
        dataBackground: {
          lineStyle: {
            opacity: 0,
          },
          areaStyle: {
            opacity: 0,
          },
        },
        selectedDataBackground: {
          lineStyle: {
            opacity: 0,
          },
          areaStyle: {
            opacity: 0,
            color: 'red',
          },
        },
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
      },
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: dataZoomEnd,
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
      },
    ]
  }
  else {
    initOption.dataZoom = [
      {
        type: 'slider',
        show: false,
      },
    ]
  }

  if (initOption && myChart)
    myChart.setOption({ ...initOption, ...option })
  // if (update) {
  //   myChart.resize();
  // }
}

export default { useBaseChart }
