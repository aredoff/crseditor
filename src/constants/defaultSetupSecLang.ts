export const MINIMAL_SETUP_SECLANG = `SecRuleEngine On
SecRequestBodyAccess On
SecResponseBodyAccess On

SecAction "id:900100,phase:1,pass,nolog,setvar:tx.critical_anomaly_score=5,setvar:tx.error_anomaly_score=4,setvar:tx.warning_anomaly_score=3,setvar:tx.notice_anomaly_score=2"
SecAction "id:900110,phase:1,pass,nolog,setvar:tx.inbound_anomaly_score_threshold=5,setvar:tx.outbound_anomaly_score_threshold=4"
SecAction "id:900990,phase:1,pass,nolog,setvar:tx.crs_setup_version=4250"
`
