<template>
  <div class="cursor-overlay">
    <!-- Remote cursors -->
    <div
      v-for="cursor in remoteCursors"
      :key="cursor.userId"
      v-show="cursor.isActive"
      class="remote-cursor"
      :style="{
        left: cursor.position.x + 'px',
        top: cursor.position.y + 'px',
        '--cursor-color': cursor.color
      }"
    >
      <!-- Cursor pointer -->
      <div class="cursor-pointer">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M2 2L8 16L11 11L16 8L2 2Z"
            fill="var(--cursor-color)"
            stroke="white"
            stroke-width="1"
          />
        </svg>
      </div>
      
      <!-- User name label -->
      <div class="cursor-label">
        {{ cursor.userName }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { remoteCursors } = useCursorTracking()
</script>

<style scoped>
.cursor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.remote-cursor {
  position: absolute;
  transform: translate(-2px, -2px);
  transition: all 0.1s ease-out;
}

.cursor-pointer {
  position: relative;
  z-index: 2;
}

.cursor-label {
  position: absolute;
  top: 20px;
  left: 8px;
  background: var(--cursor-color);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.cursor-label::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 8px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid var(--cursor-color);
}
</style>
