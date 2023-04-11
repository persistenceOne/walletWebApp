import { useSortableTable } from "../../../customHooks/useSortableTable";
import TableHead from "../../molecules/table/table-head";
import TableBody from "../../molecules/table/table-body";
import { TableProps } from "../../molecules/table/types";
import Avatar from "./avatar";

const Table = ({ data, columns }: TableProps) => {
  const [tableData, handleSorting] = useSortableTable(data, columns);
  const updateData: any[] = [];
  tableData.length
    ? tableData.map((data: any, index: number) =>
        updateData.push({
          validatorName: (
            <div className="flex items-center">
              <Avatar
                identity={data.validatorImage}
                validatorName={data.validatorName}
              />
              <p key={index} className="ml-4">
                {data.validatorName}
              </p>
            </div>
          ),
          votingPower: <p key={index}>{data.votingPower}</p>,
          commission: <p key={index}>{data.commission}%</p>,
          status: <p key={index}>{data.status}</p>,
        })
      )
    : [];
  return (
    <>
      <table className="table">
        <TableHead {...{ columns, handleSorting }} />
        <TableBody {...{ columns, tableData: updateData }} />
      </table>
    </>
  );
};

export default Table;
