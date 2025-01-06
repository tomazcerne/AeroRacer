using UnityEngine;

public class CameraController : MonoBehaviour
{
    [SerializeField] Transform[] povs;
    [SerializeField] float rotationSmoothness;
    [SerializeField] Transform targetPlane;

    private int index = 1;
    private Vector3 target;

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            index = (index + 1) % povs.Length;
        }
    }

    private void FixedUpdate()
    {
        transform.position = povs[index].position;

        Quaternion targetRotation = targetPlane.rotation;
        transform.rotation = Quaternion.Lerp(transform.rotation, targetRotation, rotationSmoothness);
    }

}
