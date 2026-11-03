<script lang="ts">
  import { subscribeAnnouncements } from '../context.js'

  let politeMessage = $state('')
  let assertiveMessage = $state('')

  $effect(() => {
    return subscribeAnnouncements(({ message, politeness }) => {
      if (politeness === 'assertive') {
        // Clear first to ensure re-announcement of identical messages
        assertiveMessage = ''
        requestAnimationFrame(() => {
          assertiveMessage = message
        })
      } else {
        politeMessage = ''
        requestAnimationFrame(() => {
          politeMessage = message
        })
      }
    })
  })

  // Clear messages after screen reader has had time to announce them
  $effect(() => {
    if (!politeMessage) return
    const t = setTimeout(() => {
      politeMessage = ''
    }, 7000)
    return () => clearTimeout(t)
  })

  $effect(() => {
    if (!assertiveMessage) return
    const t = setTimeout(() => {
      assertiveMessage = ''
    }, 7000)
    return () => clearTimeout(t)
  })
</script>

<div
  class="visually-hidden"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {politeMessage}
</div>
<div
  class="visually-hidden"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  {assertiveMessage}
</div>

<style>
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
