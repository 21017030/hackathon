// 서버 컴포넌트 - React lifecycle에 의존하지 않는 인라인 스크립트로 실행
// bfcache 복원(e.persisted)과 fresh 뒤로/앞으로 이동(back_forward) 두 경우 모두 처리
export default function BfcacheGuard() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) window.location.reload();
  });
  var nav = window.performance && window.performance.getEntriesByType('navigation')[0];
  if (nav && nav.type === 'back_forward') window.location.reload();
})();`,
      }}
    />
  );
}
