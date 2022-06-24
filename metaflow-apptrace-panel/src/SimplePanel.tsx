import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Field, PanelProps, Vector } from '@grafana/data'
import { SimpleOptions } from 'types'
import { DYTable } from 'components/DYTable'
import './SimplePanel.css'
import { Button } from '@douyinfe/semi-ui'
import { IconArrowLeft } from '@douyinfe/semi-icons'
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table'
import { Alert, Select } from '@grafana/ui'
import _ from 'lodash'
import { getDataSourceSrv } from '@grafana/runtime'
import { renderTimeBar, addSvg, fitSvgToContainer, TAP_SIDE_OPTIONS_MAP } from 'ys-metaflow-chart'
import { FlameTooltip } from 'components/FlameTooltip'
import { genServiceId, useDebounce } from 'utils/tools'
import { calcTableCellWidth, tarnsArrayToTableData } from 'utils/tables'

interface Props extends PanelProps<SimpleOptions> {}

export const SimplePanel: React.FC<Props> = ({ data, width, height }) => {
  const { series, request } = data
  const refIds = request?.targets
    ? request.targets.map((target, index) => {
        return {
          value: index,
          label: target.refId
        }
      })
    : []

  const [errMsg, setErrMsg] = useState('')
  const [selectedServiceRowId, setSelectedServiceRowId] = useState('')
  const [flameContainer, setFlameContainer] = useState<any>(undefined)
  const [flameChart, setFlameChart] = useState<any>(undefined)
  const [detailFilteIds, setDetailFilteIds] = useState<string[]>([])

  const setFlameDetailFilter = useCallback((serviceId: string, chart: any) => {
    setSelectedServiceRowId(serviceId)
    if (serviceId === '') {
      setDetailFilteIds([])
      chart.bars.forEach((bar: any) => {
        bar.props.blur = false
      })
    } else {
      chart.bars.forEach((bar: any) => {
        const blurBoolean = genServiceId(bar.data) !== serviceId
        if (!blurBoolean) {
          setDetailFilteIds(bar.data._ids || [])
        }
        bar.props.blur = blurBoolean
      })
    }
    chart.renderBars()
  }, [])

  useEffect(() => {
    const container = addSvg('.flame')
    fitSvgToContainer(container)
    setFlameContainer(container)
  }, [])

  const [mousePos, setMousePos] = useState({
    x: 0,
    y: 0
  })
  const [hoveredBarData, setHoveredBarData] = useState<undefined | {}>(undefined)
  const [flameData, setFlameData] = useState<undefined | {}>(undefined)
  const debouncedWidth = useDebounce(width, 600)
  const debouncedHeight = useDebounce(height, 600)
  useEffect(() => {
    if (!flameData || !flameContainer) {
      return
    }
    flameContainer.selectAll('*').remove()
    const renderResult = renderTimeBar(flameData)(flameContainer, {
      formatBarName: (data: any, type: string) => {
        if (type === 'app' || type === 'process') {
          return `${data._l7_protocol} ${data.request_type || ''} ${data.request_resource || ''}`
        } else {
          return _.get(TAP_SIDE_OPTIONS_MAP, [data.tap_side, 'label'], data.tap_side)
        }
      }
    })
    renderResult.bars.forEach((bar: any) => {
      bar.container.on('click', (ev: any) => {
        ev.stopPropagation()
        setFlameDetailFilter(genServiceId(bar.data), renderResult)
      })
      bar.container.on('mouseenter', (ev: any) => {
        setHoveredBarData(bar.data)
      })
      bar.container.on('mousemove', (ev: MouseEvent) => {
        setTimeout(() => {
          setMousePos({
            x: ev.clientX,
            y: ev.clientY
          })
        })
      })
      bar.container.on('mouseleave', () => {
        setHoveredBarData(undefined)
      })
    })
    flameContainer.on('click', () => {
      setFlameDetailFilter('', renderResult)
    })
    setFlameChart(renderResult)
  }, [flameData, flameContainer, debouncedWidth, setFlameDetailFilter, setMousePos])

  const [startTableLoading, setStartTableLoading] = useState(false)
  const onActive = useCallback(async (item: any) => {
    const metaFlow = await getDataSourceSrv().get('MetaFlow')
    if (!metaFlow) {
      return
    }
    try {
      setStartTableLoading(true)
      const { _id } = item
      // @ts-ignore
      const result = await metaFlow.getFlameData({ _id })
      const { services, tracing, detailList } = result
      setSelectedServiceRowId('')
      setDetailFilteIds([])
      setServiceData(services)
      setDetailData(detailList)
      setFlameData(tracing)
      setViewIndex(1)
    } catch (error: any) {
      const msg = error ? error?.data?.DESCRIPTION : ' Network Error'
      setErrMsg(msg)
    }
    setStartTableLoading(false)
  }, [])

  const [targetIndex, setTargetIndex] = useState(0)
  const startTableData = useMemo(() => {
    const columnFixedRight = 'right' as const
    const actionCloumn = {
      title: 'action',
      dataIndex: 'action',
      align: 'center',
      render: (text: string, record: any) => (
        <Button
          size="small"
          theme="borderless"
          onClick={async () => {
            onActive(record)
          }}
          disabled={!record._id}
        >
          trace
        </Button>
      ),
      fixed: columnFixedRight,
      width: 76
    }
    const target = series[targetIndex] ? series[targetIndex].fields : []

    const dataSource: Array<
      {
        key: string
      } & {
        [P in string]: string
      }
    > = []
    target.forEach((e: Field<any, Vector<any>>, i: number) => {
      e.values.toArray().forEach((val, index) => {
        if (!dataSource[index]) {
          dataSource[index] = {
            key: index + ''
          }
        }
        dataSource[index][e.name] = typeof val.toString === 'function' ? val.toString() : val
      })
    })

    const columns: Array<
      ColumnProps<{
        key: string
      }>
    > = [
      ...target.map((e: Field<any, Vector<any>>, i: number) => {
        const textLens: number[] = [
          e.name.length,
          ...dataSource.map(d => {
            return d[e.name] === null ? 0 : d[e.name].toString().length
          })
        ]
        const maxLen = Math.max(...textLens)
        return {
          title: e.name,
          dataIndex: e.name,
          width: calcTableCellWidth(maxLen)
        }
      }),
      actionCloumn
    ]
    return {
      columns,
      dataSource
    }
  }, [series, targetIndex, onActive])

  useEffect(() => {
    setStartTableLoading(false)
    setHoveredBarData(undefined)
    setViewIndex(0)
  }, [startTableData])

  const [viewIndex, setViewIndex] = useState(0)
  const contentTranslateX = useMemo(() => {
    return {
      transform: `translateX(${viewIndex * -100}%)`
    }
  }, [viewIndex])

  const bodyClassName = document.body.className
  const isDark = useMemo(() => {
    return bodyClassName.includes('theme-dark')
  }, [bodyClassName])

  const [serviceData, setServiceData] = useState([])
  const serviceTableData = useMemo(() => {
    return tarnsArrayToTableData(serviceData)
  }, [serviceData])

  const [detailData, setDetailData] = useState([])
  const detailTableData = useMemo(() => {
    const { columns, dataSource } = tarnsArrayToTableData(detailData)
    return {
      columns,
      dataSource: detailFilteIds.length
        ? dataSource.filter((e: any) => {
            return detailFilteIds.includes(e._id)
          })
        : dataSource
    }
  }, [detailData, detailFilteIds])

  const isMultiRefIds = refIds.length > 1
  const panelWidthHeight = useMemo(() => {
    return {
      width: debouncedWidth,
      height: debouncedHeight,
      isMultiRefIds
    }
  }, [debouncedWidth, debouncedHeight, isMultiRefIds])

  return (
    <div className={`metaflow-panel ${isDark ? 'semi-always-dark' : 'semi-always-light'}`}>
      <div className="content" style={contentTranslateX}>
        <div className="table-and-select">
          {isMultiRefIds ? (
            <Select
              className={'ref-select'}
              options={refIds}
              value={targetIndex}
              onChange={v => {
                setTargetIndex(v.value as number)
              }}
            ></Select>
          ) : null}
          <DYTable
            className={'table-wrap'}
            panelWidthHeight={panelWidthHeight}
            columns={startTableData.columns}
            dataSource={startTableData.dataSource}
            loading={startTableLoading}
          />
        </div>
        <div className="flame-and-tables">
          <div className="main">
            <div className="flame-wrap">
              <div className="view-title">FLAME GRAPH</div>
              <div className="flame"></div>
            </div>
            <div className="service-table-wrap">
              <div className="view-title">SERVICE LIST</div>
              <div className="service-table">
                <DYTable
                  className={'table-wrap'}
                  panelWidthHeight={panelWidthHeight}
                  columns={serviceTableData.columns}
                  dataSource={serviceTableData.dataSource}
                  onRowClick={(item: any) => {
                    const serviceId = genServiceId(item)
                    setFlameDetailFilter(serviceId === selectedServiceRowId ? '' : serviceId, flameChart)
                  }}
                  highLightRow={(item: any) => {
                    return genServiceId(item) === selectedServiceRowId ? { className: 'high-light' } : {}
                  }}
                />
              </div>
            </div>
          </div>
          <div className="detail-table-wrap">
            <div className="view-title">DETAIL LIST</div>
            <div className="detail-table">
              <DYTable
                className={'table-wrap'}
                panelWidthHeight={panelWidthHeight}
                columns={detailTableData.columns}
                dataSource={detailTableData.dataSource}
              />
            </div>
          </div>
        </div>
      </div>
      <IconArrowLeft
        className="goback-icon"
        onClick={() => {
          setViewIndex(viewIndex ? 0 : 1)
        }}
        style={{
          display: viewIndex ? '' : 'none',
          cursor: 'pointer'
        }}
      />
      <FlameTooltip barData={hoveredBarData} mousePos={mousePos}></FlameTooltip>
      {errMsg ? (
        <Alert
          title={errMsg}
          style={{
            position: 'fixed',
            top: '15px',
            right: '15px',
            zIndex: 9999
          }}
          severity="error"
          onRemove={() => setErrMsg('')}
        ></Alert>
      ) : null}
    </div>
  )
}
