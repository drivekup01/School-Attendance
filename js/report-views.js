// Keep each report's filters and output together; switching views does not load data.
export function mountReportViews(root){
 const buttons=[...root.querySelectorAll('[data-report-tab]')],views=[...root.querySelectorAll('[data-report-view]')];
 const show=key=>{for(const view of views)view.hidden=view.dataset.reportView!==key;for(const button of buttons){const active=button.dataset.reportTab===key;button.setAttribute('aria-pressed',String(active));button.classList.toggle('secondary',!active);}};
 for(const button of buttons)button.addEventListener('click',()=>show(button.dataset.reportTab));
 show('term');
}
