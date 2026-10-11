import { Scroll } from './Scroll'
import { kgText, rowTotalMg } from '../lib/kg'
import type { KgResult, KgRow } from '../lib/kg'
import type { MaterialKey } from '../lib/setups'

type Props = { result: KgResult; columns: Array<{ key: MaterialKey; label: string }> }

function Cells({ row, columns }: { row: KgRow; columns: Props['columns'] }) {
  return (
    <>
      <td>{row.parcels.toLocaleString('en-US')}</td>
      <td>{row.units.toLocaleString('en-US')}</td>
      {columns.map((column) => (
        <td key={column.key}>{kgText(row.mg[column.key])}</td>
      ))}
      <td>{kgText(rowTotalMg(row))}</td>
    </>
  )
}

export function KgTable({ result, columns }: Props) {
  return (
    <Scroll label="Kilograms by country table">
      <table className="num kg-table">
        <thead>
          <tr>
            <th scope="col">Country</th>
            <th scope="col">Parcels</th>
            <th scope="col">Units</th>
            {columns.map((column) => (
              <th scope="col" key={column.key}>{column.label} kg</th>
            ))}
            <th scope="col">Total kg</th>
          </tr>
        </thead>
        <tbody>
          {result.countries.map((row) => (
            <tr key={row.iso}>
              <th scope="row">{row.name}</th>
              <Cells row={row} columns={columns} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="strong">
            <th scope="row">Total</th>
            <Cells row={result.total} columns={columns} />
          </tr>
        </tfoot>
      </table>
    </Scroll>
  )
}
