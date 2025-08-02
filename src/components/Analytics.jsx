import { Progress } from 'antd';
import React from 'react'

const Analytics = ({ allExpenses }) => {

    const categories = ['1', '2', '3', '4', '5'];


    const totalExpenses = allExpenses.length;
    const totalType1Expenses = allExpenses.filter((transaction) => transaction.type === '1')
    const totalType2Expenses = allExpenses.filter((transaction) => transaction.type === '2')

    const totalType1Percent = (totalType1Expenses.length / totalExpenses) * 100;
    const totalType2Percent = (totalType2Expenses.length / totalExpenses) * 100;


    // turnover
    const totalTurnover = allExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const totalType1Turnover = totalType1Expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const totalType2Turnover = totalType2Expenses.reduce((acc, exp) => acc + exp.amount, 0);

    const totalType1TurnoverPercent = (totalType1Turnover / totalTurnover) * 100;
    const totalType2TurnoverPercent = (totalType2Turnover / totalTurnover) * 100;

    return (
        <>
            <div className='row m-3'>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            Total Expenses : {totalExpenses}
                        </div>
                        <div className="card-body">
                            <h5 className='text-success'> Type 1 : {totalType1Expenses.length} </h5>
                            <h5 className='text-danger'> Type 2 : {totalType2Expenses.length} </h5>

                            <Progress type='circle' strokeColor={'green'} className='mx-2'
                                percent={totalType1Percent.toFixed(0)} />
                            <Progress type='circle' strokeColor={'red'} className='mx-2'
                                percent={totalType2Percent.toFixed(0)} />
                        </div>
                    </div>
                </div>


                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            Total Expenses Amount: {totalTurnover}
                        </div>
                        <div className="card-body">
                            <h5 className='text-success'> Type 1 Amount : {totalType1Turnover} </h5>
                            <h5 className='text-danger'> Type 2 Amount: {totalType2Turnover} </h5>

                            <Progress type='circle' strokeColor={'green'} className='mx-2'
                                percent={totalType1TurnoverPercent.toFixed(0)} />
                            <Progress type='circle' strokeColor={'red'} className='mx-2'
                                percent={totalType2TurnoverPercent.toFixed(0)} />
                        </div>
                    </div>
                </div>

            </div>

            <div className="row m-3">
                <div className="col-md-4">
                    <h4>Category wise Expenses</h4>
                    {
                        categories.map(category => {
                            const amount = allExpenses.filter(exp => exp.type === category)
                                .reduce((acc, trxn) => acc + trxn.amount, 0);
                            return (
                                amount > 0 &&
                                <div className="card">
                                    <div className="card-body">
                                        <h5>{category}</h5>
                                        <Progress percent={((amount / totalTurnover)*100).toFixed(0)}></Progress>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </>
    )
}

export default Analytics