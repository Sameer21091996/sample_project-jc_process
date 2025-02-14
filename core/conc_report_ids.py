from django.conf import settings


CONC_REPORTS_IDS = {
    "WithdrawalSlipParts2WS":{
        "UAT":302360,
        "PROD":302360,
    },
    "WithdrawalSlipParts2Parts":{
        "UAT":267460,
        "PROD":267460,
    },
    "WithdrawalSlipAcs2Acs":{
        "UAT":267460,
        "PROD":267460,
    },
    "QuotationPrintOut":{
        "UAT":681581,
        "PROD":695577,
    },
    "SalesInvoicePrintOut_SPARE_PART_97":{
        "UAT":681579,
        "PROD":680580,
    },
    "SalesInvoicePrintOut_SPARE_PART_94":{
        "UAT":681578,
        "PROD":680579,
    },
    "SalesInvoicePrintOut_ACC_97":{
        "UAT":683578,
        "PROD":682579,
    },
    "SalesInvoicePrintOut_ACC_94":{
        "UAT":682578,
        "PROD":682578,
    },
    "SalesInvoicePrintOut_UNITS_97":{
        "UAT":None,
        "PROD":None,
    },
    "SalesInvoicePrintOut_UNITS_94":{
        "UAT":None,
        "PROD":None,
    },
}


def get_conc_report_id(name):
    return CONC_REPORTS_IDS[name][settings.ENV]