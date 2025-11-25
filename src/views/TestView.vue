<template>
<div style="padding: 0 4rem;">
    <h1>Drink n' Draw</h1>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="background-color: red; height: 4rem;">
            <h2>Matteus morsa går och lägger sig</h2>
        </div>
        <div style="display: flex; gap: 1rem;">
          <div style="background-color: red; width: 15vw;">
              <p>1</p>
              <p>2</p>
              <p>3</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 1rem; flex-grow: 1;">
             <GameCanvas ref="canvas" :mode="drawingMode"/>
             <CanvasTools :mode="drawingMode" @clear="canvasRef.clear()"/>
           </div>
           <div style="background-color: red; width: 20rem;">
              <p>1</p>
              <p>2</p>
              <p>3</p>
          </div>
        </div>
    </div>
</div>
</template>

<script setup>
import GameCanvas from '../components/GameCanvas.vue';
import CanvasTools from '../components/CanvasTools.vue';
import { ref, useTemplateRef } from 'vue';

const canvasRef = useTemplateRef("canvas")

const drawingMode = ref({
        mode: "brush",
        color: "black",
        size: 4,
      });

</script>