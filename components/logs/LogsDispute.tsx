/* eslint-disable @typescript-eslint/no-explicit-any */
import	React, {ReactElement, ReactNode}				from	'react';
import	axios											from	'axios';
import	{useTable, usePagination, useSortBy}			from	'react-table';
import	{Chevron}										from	'@yearn-finance/web-lib/icons';
import	{format, performBatchedUpdates, truncateHex}	from	'@yearn-finance/web-lib/utils';
import	IconLoader										from	'components/icons/IconLoader';

type		TDisputeLogs = {
	time: number,
	keeperOrJob: string,
	action: string,
	disputer: string,
	txHash: string,
}
function	LogsDispute(): ReactElement {
	const	[isInit, set_isInit] = React.useState(false);
	const	[logs, set_logs] = React.useState<TDisputeLogs[]>([]);

	React.useEffect((): void => {
		axios.get(`${process.env.BACKEND_URI as string}/disputes`)
			.then((_logs): void => {
				performBatchedUpdates((): void => {
					set_logs(_logs.data || []);
					set_isInit(true);
				});
			})
			.catch((): void => set_isInit(true));
	}, []);

	const data = React.useMemo((): unknown[] => (
		logs.map((log): unknown => ({
			date: format.date(Number(log.time) * 1000, true),
			keeperOrJob: truncateHex(log.keeperOrJob, 5),
			action: log.action,
			disputer: truncateHex(log.disputer, 5),
			txHash: log.txHash
		}))
	), [logs]);
		
	const columns = React.useMemo((): unknown[] => [
		{Header: 'Date', accessor: 'date', className: 'pr-8'},
		{Header: 'Keeper/Job', accessor: 'keeperOrJob', className: 'cell-start pr-8'},
		{Header: 'Action', accessor: 'action', className: 'cell-start pr-8'},
		{Header: 'Disputer', accessor: 'disputer', className: 'cell-start pr-8'},
		{
			Header: 'Tx Hash', accessor: 'txHash', className: 'cell-start pr-6', Cell: ({value}: {value: string}): ReactNode => truncateHex(value, 5)
		}
	], []);

	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		prepareRow,
		page,
		canPreviousPage,
		canNextPage,
		pageOptions,
		nextPage,
		previousPage,
		state: {pageIndex}
	} = useTable({columns, data, initialState: {pageSize: 50}}, useSortBy, usePagination);
	
	function	renderPreviousChevron(): ReactElement {
		if (!canPreviousPage) 
			return (<Chevron className={'h-4 w-4 cursor-not-allowed opacity-50'} />);
		return (
			<Chevron
				className={'h-4 w-4 cursor-pointer'}
				onClick={previousPage} />
		);
	}

	function	renderNextChevron(): ReactElement {
		if (!canNextPage) 
			return (<Chevron className={'h-4 w-4 rotate-180 cursor-not-allowed opacity-50'} />);
		return (
			<Chevron
				className={'h-4 w-4 rotate-180 cursor-pointer'}
				onClick={nextPage} />
		);
	}

	if (!isInit && logs.length === 0) {
		return (
			<div className={'flex h-full min-h-[112px] items-center justify-center'}>
				<IconLoader className={'h-6 w-6 animate-spin'} />
			</div>
		);
	}

	return (
		<div className={'flex w-full flex-col overflow-x-scroll'}>
			<table
				{...getTableProps()}
				className={'min-w-full overflow-x-scroll'}>
				<thead>
					{headerGroups.map((headerGroup: any): ReactElement => (
						<tr key={headerGroup.getHeaderGroupProps().key} {...headerGroup.getHeaderGroupProps()}>
							{headerGroup.headers.map((column: any): ReactElement => (
								<th
									key={column.getHeaderProps().key}
									{...column.getHeaderProps(column.getSortByToggleProps([{
										className: `pt-2 pb-8 text-left text-base font-bold whitespace-pre ${column.className}`
									}]))}>
									{column.render('Header')}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody {...getTableBodyProps()}>
					{page.map((row: any): ReactElement => {
						prepareRow(row);
						return (
							<tr
								key={row.getRowProps().key}
								{...row.getRowProps()}
								className={'cursor-pointer transition-colors hover:bg-white'}
								onClick={(): void => (window as any).open(`https://etherscan.io/tx/${row.values.txHash}`, '_blank')}>
								{row.cells.map((cell: any): ReactElement => {
									return (
										<td
											key={cell.getCellProps().key}
											{...cell.getCellProps([
												{
													className: `pt-2 pb-6 text-base font-mono whitespace-pre ${cell.column.className}`,
													style: cell.column.style
												}])
											}>
											{cell.render('Cell')}
										</td>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
			{canPreviousPage || canNextPage ? <div className={'flex flex-row items-center justify-end space-x-2 p-4'}>
				{renderPreviousChevron()}
				<p className={'select-none text-sm tabular-nums'}>
					{`${pageIndex + 1}/${pageOptions.length}`}
				</p>
				{renderNextChevron()}
			</div> : null}
		</div>
	);
}

export default LogsDispute;
