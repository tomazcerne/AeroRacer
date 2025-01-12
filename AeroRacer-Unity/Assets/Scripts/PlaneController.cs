using UnityEngine;
using TMPro;

public class PlaneController : MonoBehaviour
{
    public float throttleIncrement = 5f;
    public float maxThrust = 2500f;
    public float pitchResponsiveness = 25f;
    public float yawResponsiveness = 15f;
    public float rollResponsiveness = 3f;

    public float rollImpactFactor = 0.5f;
    public float lift = 250f;

    public float throttle = 50;
    private float rollInput;
    private float pitchInput;
    private float yawInput;

    private float rollAngle;
    private float pitchAngle;
    private float yawAngle;

    Rigidbody rb;
    AudioSource engineSound;
    [SerializeField] TextMeshProUGUI topLeftHud;
    [SerializeField] TextMeshProUGUI topRightHud;
    [SerializeField] GameObject gameOverScreen; // Reference to a Game Over UI panel

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        engineSound = GetComponent<AudioSource>();
    }



    private void HandleInput()
    {
        rollInput = Input.GetAxis("Roll");
        pitchInput = Input.GetAxis("Pitch");
        yawInput = Input.GetAxis("Yaw");

        if (Input.GetKey(KeyCode.UpArrow))
        {
            throttle += throttleIncrement * Time.deltaTime;
        }
        else if (Input.GetKey(KeyCode.DownArrow))
        {
            throttle -= throttleIncrement * Time.deltaTime;
        }
        throttle = Mathf.Clamp(throttle, 0f, 100f);
    }

    private void Update()
    {
        HandleInput();
        UpdatePitchRollYawAngles();
        UpdateTopLeftHud();
        UpdateTopRightHud();
        UpdateSound();
    }

    private void FixedUpdate()
    {
        rb.AddForce(transform.forward * throttle * maxThrust);

        yawInput += rollImpactFactor * RollImpact();

        float adjustmentFactor = 50f;
        float pitchTorque = pitchInput * adjustmentFactor * pitchResponsiveness;
        float yawTorque = yawInput * adjustmentFactor * yawResponsiveness;
        float rollTorque = rollInput * adjustmentFactor * rollResponsiveness;

        rb.AddTorque(transform.right * pitchTorque);
        rb.AddTorque(transform.up * yawTorque);
        rb.AddTorque(transform.forward * rollTorque);

        rb.AddForce(rb.transform.up * rb.linearVelocity.magnitude * lift);
    }

    private void OnCollisionEnter(Collision collision)
    {
        Debug.Log($"Game Over: Plane collided with {collision.gameObject.name}.");
        EndGame();
    }

private void EndGame()
{
    Debug.Log("Activating Game Over Screen.");

    rb.isKinematic = true; // Stop physics simulation for the plane
    engineSound.Stop();    // Stop engine sound
    
    if (gameOverScreen != null)
    {
        gameOverScreen.SetActive(true); // Show the Game Over screen
    }
    else
    {
        Debug.LogWarning("Game Over Screen is not assigned in the Inspector.");
    }
    
    Time.timeScale = 0;    // Pause the game
}

    private void UpdatePitchRollYawAngles()
    {
        rollAngle = transform.eulerAngles.z;
        if (rollAngle > 180f) rollAngle -= 360f;
        rollAngle *= -1f;

        pitchAngle = transform.eulerAngles.x;
        if (pitchAngle > 180f) pitchAngle -= 360f;
        pitchAngle *= -1f;

        yawAngle = transform.eulerAngles.y;
    }

    private float RollImpact()
    {
        float angle = transform.eulerAngles.z;
        float impact = angle;
        if (angle > 45 && angle <= 135)
        {
            impact = 90 - angle;
        }
        else if (angle > 135 && angle <= 225)
        {
            impact = angle - 180;
        }
        else if (angle > 225 && angle <= 315)
        {
            impact = 270 - angle;
        }
        else if (angle > 315)
        {
            impact = angle - 360;
        }
        if (angle < 90 || angle > 270)
        {
            impact *= -1;
        }
        return impact / 45;
    }

    private void UpdateTopLeftHud()
    {
        topLeftHud.text = $"Airspeed: {(rb.linearVelocity.magnitude * 3.6f):F0} km/h\n";
        topLeftHud.text += $"Altitude: {transform.position.y:F0} m\n";
        topLeftHud.text += $"Throttle: {throttle:F0}%";
    }

    private void UpdateTopRightHud()
    {
        topRightHud.text = $"Pitch: {pitchAngle:F0}°\n";
        topRightHud.text += $"Roll: {rollAngle:F0}°\n";
        topRightHud.text += $"Yaw: {yawAngle:F0}°";
    }

    private void UpdateSound()
    {
        engineSound.volume = throttle * 0.01f;
    }
    

}
