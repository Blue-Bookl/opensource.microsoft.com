// Detect GPC
const globalPrivacyControlEnabled = navigator.globalPrivacyControl;

const isDebugging = false;
const oneDsTelemetryInstrumentationKey = '';
const oneDsEnvironmentDescriptor = '';

// 1DS telemetry
// ---
function inject1ds() {
  if (!oneDsTelemetryInstrumentationKey) {
    return;
  }
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://js.monitor.azure.com/scripts/c/ms.analytics-web-3.min.js';
  script.async = true;
  script.onload = () => {
    initialize1dsAnalytics(oneDsTelemetryInstrumentationKey);
  };
  document.head.appendChild(script);
}

function initialize1dsAnalytics(instrumentationKey) {
  // Make sure the oneDS object is available
  if (typeof window['oneDS'] === 'undefined') {
    return;
  }
  const oneDS = window['oneDS'];
  const ApplicationInsights = oneDS.ApplicationInsights;
  if (!ApplicationInsights) {
    return;
  }

  const analytics = new ApplicationInsights();
  const env = oneDsEnvironmentDescriptor || 'unknown';
  const config = {
    instrumentationKey: instrumentationKey,
    channelConfiguration: {
      eventsLimitInMem: 50
    },
    propertyConfiguration: {
      env,
    },
    webAnalyticsConfiguration: {
      autoCapture: {
        scroll: true,
        pageView: true,
        onLoad: true,
        onUnload: true,
        click: true,
        resize: true,
        jsError: true
      }
    }
  };
  analytics.initialize(config, []);
}

// Cookie consent management
// ---

// Set data sharing opt-in to false when GPC/AMC controls detected
const GPC_DataSharingOptIn = (globalPrivacyControlEnabled) ? false : checkThirdPartyAdsOptOutCookie();

// Detect AMC opt out choice
function checkThirdPartyAdsOptOutCookie() {
  try {
    const ThirdPartyAdsOptOutCookieName = '3PAdsOptOut';
    var cookieValue = getCookie(ThirdPartyAdsOptOutCookieName);

    //for unauthenticated users
    return cookieValue != 1;
  } catch {
    return true;
  }
}

function getCookie(cookieName) {
  var cookieValue = document.cookie.match('(^|;)\\s*' + cookieName + '\\s*=\\s*([^;]+)');
  return (cookieValue) ? cookieValue[2] : '';
}

function enableAppInsights() {
  var appInsights=window.appInsights||function(config){function s(config){t[config]=function(){var i=arguments;t.queue.push(function(){t[config].apply(t,i)})}}var t={config:config},r=document,f=window,e="script",o=r.createElement(e),i,u;for(o.src=config.url||"//az416426.vo.msecnd.net/scripts/a/ai.0.js",r.getElementsByTagName(e)[0].parentNode.appendChild(o),t.cookie=r.cookie,t.queue=[],i=["Event","Exception","Metric","PageView","Trace"];i.length;)s("track"+i.pop());return config.disableExceptionTracking||(i="onerror",s("_"+i),u=f[i],f[i]=function(config,r,f,e,o){var s=u&&u(config,r,f,e,o);return s!==!0&&t["_"+i](config,r,f,e,o),s}),t}({instrumentationKey:"98f90d2e-54e0-4e9c-a919-deea70bad056"/*the telemetry instrumentation key is NOT a secret FYI */});window.appInsights=appInsights;appInsights.trackPageView();
}

function enable1ds() {
  inject1ds();
}

var siteConsent = null;

const currentUrl = window.location.href;
const searchParams = new URLSearchParams(new URL(currentUrl).search);
var showTelemetryDebug = searchParams.has('console');
if (showTelemetryDebug) {
  console.log('Will show telemetry debug in the console.');
}

function enableAnalytics() {
  var config = {
    coreData: {
      appId: 'opensource.microsoft.com'
    }
  };
  // no longer using this secondary provider: awa.init(config);
}
function addTelemetry() {
  enableAppInsights();
  enableAnalytics();
  enable1ds();
}
function onConsentChanged(categoryPreferences) {
  showTelemetryDebug && console.log('onConsentChanged.');
  evaluateUserConsent();
  evaluateShowManagement();
}
function evaluateShowManagement() {
  document.getElementById('manageCookies').style.display = siteConsent.isConsentRequired ? 'inline-block' : 'none';
}
function evaluateUserConsent() {
  try {
    // only connect if there is opt-in (Cali.) and/or cookie banner consent in a required place
    if (GPC_DataSharingOptIn === true && siteConsent && siteConsent.getConsentFor(WcpConsent.consentCategories.Analytics)) {
      addTelemetry();
      showTelemetryDebug && console.log('Telemetry added.');
    } else {
      if (GPC_DataSharingOptIn === false) {
        showTelemetryDebug && console.log('No data sharing opt-in present.');
      } else {
        showTelemetryDebug && console.log('No site consent for telemetry.');
      }
    }
  } catch (error) {
    if (showTelemetryDebug) {
      console.dir(error);
    }
  }
}
function tryInitializeWcp() {
  WcpConsent.init('en-US', 'cookiebanner', function (err, _siteConsent) {
    if (err != undefined) {
      if (showTelemetryDebug) {
        console.log('WcpConsent.init error', err);
      }
      return err;
    } else {
      siteConsent = _siteConsent;
      if (showTelemetryDebug) {
        console.log('WcpConsent.init', siteConsent);
      }
    }
    evaluateShowManagement();
    evaluateUserConsent();
  }, onConsentChanged);
}

function manageCookies() {
  if(siteConsent.isConsentRequired){
    siteConsent.manageConsent();
  }
  return false;
}
