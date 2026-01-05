export default function Head() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof global === 'undefined') {
              window.global = window;
            }
          `,
        }}
      />
    </>
  );
}
