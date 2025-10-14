import { describe, it, expect, beforeEach } from 'vitest'
import { useShapes } from '~/composables/useShapes'

describe('useShapes Composable', () => {
  let shapes: ReturnType<typeof useShapes>

  beforeEach(() => {
    shapes = useShapes(800, 600)
  })

  describe('Shape Creation', () => {
    it('should create a rectangle with default properties', () => {
      const rectangle = shapes.addRectangle()
      
      expect(rectangle).toMatchObject({
        type: 'rectangle',
        width: 100,
        height: 60,
        draggable: true
      })
      expect(rectangle.id).toMatch(/^rect_/)
      expect(rectangle.x).toBeGreaterThanOrEqual(0)
      expect(rectangle.x).toBeLessThan(700) // canvasWidth - 100
      expect(rectangle.y).toBeGreaterThanOrEqual(0)
      expect(rectangle.y).toBeLessThan(500) // canvasHeight - 100
    })

    it('should create a circle with default properties', () => {
      const circle = shapes.addCircle()
      
      expect(circle).toMatchObject({
        type: 'circle',
        radius: 50,
        draggable: true
      })
      expect(circle.id).toMatch(/^circle_/)
    })

    it('should create text with default properties', () => {
      const text = shapes.addText()
      
      expect(text).toMatchObject({
        type: 'text',
        text: 'Hello Konva!',
        fontSize: 24,
        draggable: true
      })
      expect(text.id).toMatch(/^text_/)
    })

    it('should create shapes with custom properties', () => {
      const rectangle = shapes.addRectangle({
        x: 100,
        y: 200,
        width: 150,
        height: 80,
        fill: '#FF0000'
      })
      
      expect(rectangle).toMatchObject({
        x: 100,
        y: 200,
        width: 150,
        height: 80,
        fill: '#FF0000'
      })
    })

    it('should create shapes with rotation', () => {
      const rectangle = shapes.addRectangle({
        rotation: 45
      })
      
      expect(rectangle.rotation).toBe(45)
    })

    it('should default rotation to 0', () => {
      const rectangle = shapes.addRectangle()
      const circle = shapes.addCircle()
      const text = shapes.addText()
      
      expect(rectangle.rotation).toBe(0)
      expect(circle.rotation).toBe(0)
      expect(text.rotation).toBe(0)
    })
  })

  describe('Shape Management', () => {
    it('should track total shapes count', () => {
      expect(shapes.totalShapes.value).toBe(0)
      
      shapes.addRectangle()
      expect(shapes.totalShapes.value).toBe(1)
      
      shapes.addCircle()
      shapes.addText()
      expect(shapes.totalShapes.value).toBe(3)
    })

    it('should select shapes', () => {
      const rectangle = shapes.addRectangle()
      
      shapes.selectShape(rectangle.id)
      expect(shapes.selectedShapeId.value).toBe(rectangle.id)
      
      shapes.selectShape(null)
      expect(shapes.selectedShapeId.value).toBe(null)
    })

    it('should update shape properties', () => {
      const rectangle = shapes.addRectangle()
      const newX = 300
      const newY = 400
      
      shapes.updateShape(rectangle.id, { x: newX, y: newY })
      
      const updatedShape = shapes.getShapeById(rectangle.id)
      expect(updatedShape).toMatchObject({
        x: newX,
        y: newY
      })
    })

    it('should update shape rotation', () => {
      const rectangle = shapes.addRectangle()
      const newRotation = 90
      
      shapes.updateShape(rectangle.id, { rotation: newRotation })
      
      const updatedShape = shapes.getShapeById(rectangle.id)
      expect(updatedShape).toBeTruthy()
      expect(updatedShape!.rotation).toBe(newRotation)
    })

    it('should handle rotation updates for all shape types', () => {
      const rectangle = shapes.addRectangle()
      const circle = shapes.addCircle()
      const text = shapes.addText()
      
      shapes.updateShape(rectangle.id, { rotation: 45 })
      shapes.updateShape(circle.id, { rotation: 90 })
      shapes.updateShape(text.id, { rotation: 180 })
      
      expect(shapes.getShapeById(rectangle.id)?.rotation).toBe(45)
      expect(shapes.getShapeById(circle.id)?.rotation).toBe(90)
      expect(shapes.getShapeById(text.id)?.rotation).toBe(180)
    })

    it('should delete shapes', () => {
      const rectangle = shapes.addRectangle()
      const circle = shapes.addCircle()
      
      expect(shapes.totalShapes.value).toBe(2)
      
      const deleted = shapes.deleteShape(rectangle.id)
      expect(deleted).toBe(true)
      expect(shapes.totalShapes.value).toBe(1)
      expect(shapes.getShapeById(rectangle.id)).toBe(null)
      
      // Circle should still exist
      expect(shapes.getShapeById(circle.id)).not.toBe(null)
    })

    it('should delete selected shape', () => {
      const rectangle = shapes.addRectangle()
      shapes.selectShape(rectangle.id)
      
      const deleted = shapes.deleteSelectedShape()
      expect(deleted).toBe(true)
      expect(shapes.selectedShapeId.value).toBe(null)
      expect(shapes.totalShapes.value).toBe(0)
    })

    it('should clear all shapes', () => {
      shapes.addRectangle()
      shapes.addCircle()
      shapes.addText()
      shapes.selectShape('some-id')
      
      shapes.clearAllShapes()
      
      expect(shapes.totalShapes.value).toBe(0)
      expect(shapes.selectedShapeId.value).toBe(null)
    })
  })

  describe('Shape Retrieval', () => {
    it('should get shape by ID', () => {
      const rectangle = shapes.addRectangle()
      const circle = shapes.addCircle()
      
      expect(shapes.getShapeById(rectangle.id)).toMatchObject(rectangle)
      expect(shapes.getShapeById(circle.id)).toMatchObject(circle)
      expect(shapes.getShapeById('non-existent')).toBe(null)
    })

    it('should get shape by type', () => {
      const rectangle = shapes.addRectangle()
      const circle = shapes.addCircle()
      const text = shapes.addText()
      
      expect(shapes.getShapeByType('rectangle', rectangle.id)).toMatchObject(rectangle)
      expect(shapes.getShapeByType('circle', circle.id)).toMatchObject(circle)
      expect(shapes.getShapeByType('text', text.id)).toMatchObject(text)
      expect(shapes.getShapeByType('rectangle', 'non-existent')).toBe(null)
    })
  })
})
