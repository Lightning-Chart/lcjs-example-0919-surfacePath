/**
 * Example showcasing the Surface Grid Series feature of LightningChart JS.
 */
// Import LightningChartJS
const lcjs = require('@lightningchart/lcjs')

// Import xydata
const xydata = require('@lightningchart/xydata')

const { lightningChart, LUT, PalettedFill, emptyLine, ColorShadingStyles, regularColorSteps, SolidLine, Themes, LegendPosition } = lcjs
const { createWaterDropDataGenerator } = xydata

const HEATMAP_COLUMNS = 500
const HEATMAP_ROWS = 500

const exampleContainer = document.getElementById('chart') || document.body
if (exampleContainer === document.body) {
    exampleContainer.style.width = '100vw'
    exampleContainer.style.height = '100vh'
    exampleContainer.style.margin = '0px'
}
const containerChart1 = document.createElement('div')
const containerChart2 = document.createElement('div')
exampleContainer.append(containerChart1)
exampleContainer.append(containerChart2)
containerChart1.style.width = '100%'
containerChart1.style.height = '70%'
containerChart2.style.width = '100%'
containerChart2.style.height = '30%'

const lc = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
const chart3D = lc
    .Chart3D({
        legend: { position: LegendPosition.RightCenter },
        container: containerChart1,
        theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
    })
    .setTitle('Click twice to project path to 2D')
    .setBoundingBox({ x: 1, z: 1, y: 0.4 })
    .setCameraAutomaticFittingEnabled(false)
    .setCameraLocation({ x: 2.3/5, z: 4.4/5, y: 5/5 })
    .setCursorMode(undefined)
    .setProjection('orthographic')

const chart2D = lc
    .ChartXY({
        legend: { visible: false },
        container: containerChart2,
        // theme: Themes.darkGold
    })
    .setTitle('')
chart2D.forEachAxis((axis) => axis.setAnimationScroll(false))
chart2D.axisY.setInterval({ start: 0, end: 100 })
chart2D.axisX.setTitle('Distance')

createWaterDropDataGenerator()
    .setColumns(HEATMAP_COLUMNS)
    .setRows(HEATMAP_ROWS)
    .generate()
    .then((data) => {
        const theme = chart3D.getTheme()
        const lut = new LUT({
            interpolate: true,
            steps: regularColorSteps(0, 70, theme.examples.coldHotColorPalette),
        })
        const palettedFill = new PalettedFill({ lut, lookUpProperty: 'y' })

        const surfaceSeries3D = chart3D
            .addSurfaceGridSeries({
                columns: HEATMAP_COLUMNS,
                rows: HEATMAP_ROWS,
            })
            .setFillStyle(palettedFill)
            .setWireframeStyle(emptyLine)
            .setColorShadingStyle(new ColorShadingStyles.Phong())
            .invalidateHeightMap(data)

        const projection2D = chart2D.addPointLineAreaSeries().setAreaFillStyle(palettedFill)

        chart2D.axisY.setStrokeStyle(new SolidLine({ thickness: 3, fillStyle: palettedFill }))

        // Custom interaction;
        // Click to draw path along 3D surface heatmap.
        let pointA
        let pointB
        const pathSeries = chart3D
            .addPointSeries({ individualPointSizeEnabled: true, legend: null })
            .setPointerEvents(false)
            .setAutoScrollingEnabled(false)
        const updtPath = () => {
            const points = []
            const points2D = []
            if (pointA) {
                points.push({ ...pointA, size: 15 })
            }
            if (pointA && pointB) {
                points2D.push({ x: 0, y: pointA.y })
                const dX = pointB.x - pointA.x
                const dZ = pointB.z - pointA.z
                const length = Math.sqrt(dX ** 2 + dZ ** 2)
                const dir = { x: dX / length, z: dZ / length }
                const stepXZ = 5
                for (let pos = stepXZ; pos <= length - stepXZ; pos += stepXZ) {
                    const x = pointA.x + pos * dir.x
                    const z = pointA.z + pos * dir.z
                    const y = data[Math.round(x)][Math.round(z)]
                    points.push({ x, z, y, size: 8 })
                    points2D.push({ x: pos, y })
                }
                points.push({ ...pointB, size: 15 })
                points2D.push({ x: length, y: pointB.y })
            }
            pathSeries.clear().add(points)
            projection2D.clear().appendJSON(points2D)
        }
        surfaceSeries3D.addEventListener('pointermove', (event, hit) => {
            if (!pointA || pointA.preview) {
                pointA = { ...hit, preview: true }
            } else if (!pointB || pointB.preview) {
                pointB = { ...hit, preview: true }
            }
            updtPath()
        })
        surfaceSeries3D.addEventListener('click', (event, hit) => {
            if (!pointA || pointA.preview) {
                pointA = hit
            } else if (!pointB || pointB.preview) {
                pointB = hit
            } else {
                pointA = undefined
                pointB = undefined
            }
            updtPath()
        })
    })
